// src/lib/aiModeration.js
// Moderación asistida por IA para el automod.
//
// ════════════════════════════════════════════════════════════════════════════
// POR QUÉ NO REEMPLAZA AL AUTOMOD CLÁSICO
// ════════════════════════════════════════════════════════════════════════════
//
// El automod por palabras es barato, instantáneo y no falla. La IA es lenta
// (2-8 segundos), cara (gasta cuota) y se equivoca. Si la IA decide siempre, el
// bot empieza a borrar mensajes que no debía y la gente deja de confiar en él.
//
// Así que la IA va DESPUÉS, no en lugar de:
//
//   1. El filtro clásico corre primero. Si no hay duda, no se llama a la IA.
//      Eso significa que solo se consulta en el 1-5% de los mensajes.
//   2. La IA analiza SOLO los que dispararon una regla pero podrían ser
//      falsos positivos: "chiste negro", "película", una palabra prohibida
//      dentro de una cita.
//   3. Salvo que la confianza sea alta, la IA solo RECOMIENDA: deja el mensaje
//      y avisa al canal de moderación para que un humano decida.
//
// Es una herramienta de apoyo para humanos, no un juez automático.

const { askJson } = require('./ai');
const { extractJson, asBoolean, asNumber } = require('./jsonExtract');

/**
 * Cuánto esperamos a la IA antes de decidir con el filtro clásico.
 *
 * El plazo NO es negociable. Mientras se espera, el mensaje está visible en el
 * canal: un moderador que tarda 20 segundos en decidir ya dejó pasar lo que
 * tenía que sacar, y el culpable seLlevó unaISPADA. Medido con Pollinations
 * (el único sin key) las respuestas tardan entre 6 y 30 segundos, así que ahí
 * la IA no sirve para decidir: solo para avisar.
 *
 * Con Groq o Gemini la respuesta llega en 1-3 segundos y sí sirve.
 * Pasado este plazo se aplica la decisión clásica sin más consulta.
 */
const TIMEOUT_MS = 8000;
// Antes 120 tokens, y eso era POCO: el objeto tiene cinco campos y el motivo
// puede ocupar 15 palabras. Con 120, Qwen se cortaba a mitad del string del
// motivo y el veredicto se perdía entero. 400 es holgado de sobra y sigue
// siendo barato: lo que sale es un objeto de ~80 tokens.
const MAX_TOKENS = 400;

const SYSTEM = `Sos un moderador de un servidor de Discord. Tu única salida es un
objeto JSON. Nada más: ni texto, ni markdown, ni explicaciones.

FORMATO (respetá estos nombres de campo y tipos exactos):
{
  "violacion": booleano,
  "tipo": "insulto" | "amenaza" | "odio" | "sexual" | "drogas" | "spam" | "otro" | null,
  "gravedad": entero del 0 al 10,
  "motivo": string de menos de 15 palabras,
  "esFalsoPositivo": booleano
}

Reglas de judgment:
- "esFalsoPositivo" va true cuando el mensaje parece una cita, una broma, una
  referencia a una película o canción, o un uso normal de una palabra que
  parece prohibida. En ese caso "violacion" va false.
- No moderes opiniones, política, palabras groseras sin destinatario, ni bromas
  entre amigos.
- Si es odio dirigido claramente contra una persona, "violacion" va true.
- "gravedad": 1 es leve, 10 es una amenaza de muerte.
- Si no sabés, mandá null. No inventes.`;


/**
 * El mismo esquema que describe el system prompt, en JSON.
 *
 * Se pasa aparte porque askJson lo muestra al modelo con formato legible, y
 * porque documenta la forma esperada en un solo lugar legible por una persona
 * (el system prompt es para el modelo, esto es para quien lo lee).
 */
const VERDICT_SCHEMA = {
    type: 'object',
    required: ['violacion', 'gravedad', 'motivo', 'esFalsoPositivo'],
    properties: {
        violacion: { type: 'boolean' },
        tipo: {
            type: ['string', 'null'],
            enum: ['insulto', 'amenaza', 'odio', 'sexual', 'drogas', 'spam', 'otro', null],
        },
        gravedad: { type: 'integer', minimum: 0, maximum: 10 },
        motivo: { type: 'string', maxLength: 120 },
        esFalsoPositivo: { type: 'boolean' },
    },
};

/**
 * Convierte lo que respondió el modelo en un veredicto usable.
 *
 * ANTES usaba un regex greedy (`/\{[\s\S]*\}/`), que se rompe en cuanto el
 * modelo devuelve un objeto y después un ejemplo con otro objeto: se come los
 * dos y `JSON.parse` no puede con eso. Ahora pasa por extractJson, que resuelve
 * los casos reales que devuelven estos modelos: markdown alrededor, una frase
 * antes, comas colgantes, comillas simples y respuesta cortada a la mitad por
 * falta de tokens.
 *
 * Los valores también se normalizan: los modelos mandan "false" como texto o la
 * gravedad como "8/10", y sin eso el veredicto se descartaba entero aunque la
 * IA hubiera acertado.
 */
function parseVerdict(raw) {
    if (!raw) return null;

    // El validador EXIGE un booleano de verdad en "violacion", y eso es a
    // propósito: si el modelo no siguió el schema, no se actúa sobre una
    // respuesta a medio entender y el automod vuelve a su decisión clásica (que
    // es la conservadora). Aceptar "sí" o "no" como booleanos haría que el bot
    // borrara (o no borrara) un mensaje según cómo escribió el modelo
    // que no entendió lo que se le pidió.
    //
    // Los OTROS campos sí se normalizan, porque perder un veredicto entero
    // porque la gravedad vino como "8/10" es pérdida de información sin ningún
    // beneficio de seguridad.
    const parsed = extractJson(raw, { validator: (v) => typeof v.violacion === 'boolean' });
    if (!parsed.ok) return null;

    const data = parsed.value;

    return {
        violacion: data.violacion,
        tipo: data.tipo && typeof data.tipo === 'string' ? data.tipo.slice(0, 30) : null,
        gravedad: Math.round(asNumber(data.gravedad, { min: 0, max: 10, fallback: 0 })),
        motivo: String(data.motivo || '').slice(0, 120),
        esFalsoPositivo: asBoolean(data.esFalsoPositivo, false),
        // Se propaga para que el log diga "hubo que reparar la respuesta", que
        // es la señal de que hay que revisar el prompt o subir max_tokens.
        reparado: Boolean(parsed.repaired),
    };
}

/**
 * Analiza un mensaje. Nunca tira: si algo falla, devuelve `null` y el automod
 * sigue con su decisión original. Una IA caída no puede dejar el server sin
 * moderación.
 *
 * @param {string} content
 * @param {object} [opts]
 * @param {string} [opts.reason] Por qué lo marcó el filtro clásico.
 * @returns {Promise<{violacion, tipo, gravedad, motivo, esFalsoPositivo, provider}|null>}
 */
async function analyze(content, { reason } = {}) {
    const text = String(content || '').trim();
    // Mensajes demasiado cortos no tienen nada que analizar y consumen cuota.
    if (text.length < 8) return null;

    const started = Date.now();

    try {
        // `race` con un timer propio, y no el timeout de http.js: el que
        // importa acá es el plazo TOTAL, no el de cada reintento.
        const result = await Promise.race([
            askJson(
                `Regla que se disparó: ${reason || 'ninguna'}\nMensaje: ${text}`,
                {
                    system: SYSTEM,
                    schema: VERDICT_SCHEMA,
                    // El validador hace doble trabajo: le dice al extractor
                    // "este es el objeto que busco" y descarta candidatos que
                    // no lo sean.
                    validator: (v) => typeof v.violacion !== 'undefined',
                    maxTokens: MAX_TOKENS,
                    temperature: 0.1, // queremos consistencia, no creatividad
                    useQueue: false, // moderación no puede esperar: el mensaje ya está
                    retries: 0, // un reintento de más duplicaría el plazo
                    context: { kind: 'moderation' },
                },
            ),
            new Promise((_, reject) => setTimeout(
                () => reject(new Error(`la IA tardó más de ${TIMEOUT_MS / 1000}s`)),
                TIMEOUT_MS,
            )),
        ]);

        const verdict = parseVerdict(result.raw);
        if (!verdict) {
            throw new Error(result.reason || 'no se pudo interpretar la respuesta');
        }

        return {
            ...verdict,
            provider: result.providerLabel,
            cached: result.cached,
            intentos: result.attempts,
        };
    } catch (err) {
        console.warn(`[ai-moderation] Sin veredicto en ${Date.now() - started}ms: ${err.message.slice(0, 80)}`);
        return null;
    }
}

/**
 * ¿El veredicto justifica BORRAR sin intervención humana?
 * Solo con gravedad alta y sin señal de falso positivo.
 */
function shouldAutoAct(verdict) {
    return Boolean(verdict && verdict.violacion && !verdict.esFalsoPositivo && verdict.gravedad >= 8);
}

/** ¿Vale la pena avisarle a un humano? */
function shouldEscalate(verdict) {
    return Boolean(
        verdict
        && (verdict.esFalsoPositivo || (verdict.violacion && verdict.gravedad >= 5)),
    );
}

/** Explicación para el panel de logs. */
function describe(verdict) {
    if (!verdict) return 'La IA no pudo analizar el mensaje.';
    if (verdict.esFalsoPositivo) {
        return `La IA lo marcó como **falso positivo** (${verdict.motivo || 'uso normal de la palabra'}).`;
    }
    if (verdict.violacion) {
        return `Violación **${verdict.tipo || 'sin clasificar'}**, gravedad ${verdict.gravedad}/10. ${verdict.motivo}`;
    }
    return `Sin violación: ${verdict.motivo || 'nada que reportar'}.`;
}

module.exports = {
    analyze, shouldAutoAct, shouldEscalate, describe, parseVerdict,
    VERDICT_SCHEMA, MAX_TOKENS,
};
