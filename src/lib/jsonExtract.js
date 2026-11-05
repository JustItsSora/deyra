// src/lib/jsonExtract.js
//
// Saca un objeto JSON de lo que devuelve un modelo de lenguaje.
//
// ════════════════════════════════════════════════════════════════════════════
// POR QUÉ ESTE ARCHIVO EXISTE
// ════════════════════════════════════════════════════════════════════════════
//
// Pedirle JSON a un modelo y creerle la palabra es la fuente de errores más
// común en un bot con IA. En la práctica, cuando le pedís JSON a un modelo,
// pasa una de estas cosas:
//
//   1. Devuelve el JSON limpio.           → funciona (y es el caso raro)
//   2. Lo envuelve en ```json ... ```     → el parser revienta
//   3. Agrega una frase antes o después.  → el parser revienta
//   4. Devuelve DOS objetos (el JSON y un
//      ejemplo de qué no hacer).          → el parser se come los dos
//   5. Usa comillas simples o comas al
//      final.                            → JSON.parse no lo acepta
//   6. Lo corta a mitad de camino porque
//      se acabó el max_tokens.            → JSON incompleto
//
// El caso 4 es el que más duele, y es el que tenía el bot: el patrón
// `/\{[\s\S]*\}/` es GREEDY, así que con dos llaves abre y cierra toma la
// última, o sea agarra el JSON más el ejemplo de arriba, y `JSON.parse` dice
// "Unexpected token" y el veredicto de moderación se pierde.
//
// Con Qwen en Groq los casos 2, 3 y 6 son los frecuentes: el
// modelo ayuda con commentary y se le acaba el presupuesto de tokens a mitad
// del objeto.
//
// La estrategia acá NO es "limpiar y rezar": es
//   1. buscar el objeto JSON balanceado más razonable,
//   2. intentar parsearlo,
//   3. si falla, repararlo con transformaciones conservadoras y Parsear otra vez,
//   4. si igual falla, devolver `ok: false` con el motivo. Nunca inventar un
//      objeto: un default silencioso hace que el bot crea que la IA respondió
//      cuando en realidad no entendió nada.
//
// "Conservadora" es la palabra clave: solo se arregla lo que tiene un valor
// inequívoco (quitar una coma que sobra, cambiar comillas simples por dobles).
// No se adivina ni se completa contenido.

/** Resultado de un intento de parseo. */
const SIN_JSON = { ok: false, value: null, reason: 'sin objeto JSON en la respuesta', repaired: false };

/**
 * Encuentra el primer objeto JSON balanceado, ignorando las llaves que
 * estén dentro de strings.
 *
 * @param {string} text
 * @returns {string|null}
 */
function extractBalanced(text) {
    const s = String(text ?? '');
    let start = -1;
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < s.length; i++) {
        const ch = s[i];

        if (escaped) { escaped = false; continue; }

        if (ch === '\\') {
            // Solo cuenta como escape dentro de un string.
            if (inString) escaped = true;
            continue;
        }

        if (ch === '"') { inString = !inString; continue; }

        if (inString) continue;

        if (ch === '{') {
            if (depth === 0) start = i;
            depth++;
            continue;
        }

        if (ch === '}') {
            if (depth > 0) depth--;
            if (depth === 0 && start !== -1) return s.slice(start, i + 1);
        }
    }

    // Nunca cerró: lo cortaron. Se devuelve desde la apertura para que
    // repairTruncated pueda cerrar lo que falta.
    return start !== -1 ? s.slice(start) : null;
}

/** Quita cercas de markdown: ```json ... ``` o ``` ... ```. */
function stripFences(text) {
    const s = String(text ?? '');
    const fence = s.match(/```(?:json|JSON|javascript)?\s*([\s\S]*?)```/);
    if (fence) return fence[1].trim();
    // Cercas sin cerrar (caso del truncado): se saca la apertura.
    return s.replace(/```(?:json|JSON|javascript)?\s*/g, '').trim();
}

/**
 * Posiciones de las comas que están a nivel 1 (dentro del objeto raíz) y fuera
 * de strings. Son los únicos puntos donde se puede cortar un JSON truncado sin
 * romper nada: cada coma cierra un par clave/valor completo.
 */
function topLevelCommas(s) {
    const out = [];
    let depth = 0;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < s.length; i++) {
        const ch = s[i];
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { if (inString) escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{' || ch === '[') depth++;
        else if (ch === '}' || ch === ']') depth--;
        else if (ch === ',' && depth === 1) out.push(i);
    }
    return out;
}

/** Cierra el string y los contenedores que quedaron abiertos. */
function closeOpen(s) {
    let out = s;
    let inString = false;
    let escaped = false;

    for (const ch of out) {
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (ch === '"') inString = !inString;
    }
    if (inString) out += '"';

    const stack = [];
    inString = false;
    escaped = false;
    for (const ch of out) {
        if (escaped) { escaped = false; continue; }
        if (ch === '\\') { escaped = true; continue; }
        if (ch === '"') { inString = !inString; continue; }
        if (inString) continue;
        if (ch === '{' || ch === '[') stack.push(ch);
        else if (ch === '}' || ch === ']') stack.pop();
    }
    for (let i = stack.length - 1; i >= 0; i--) out += stack[i] === '{' ? '}' : ']';
    return out;
}

/**
 * Recorta un JSON que se cortó a mitad de camino.
 *
 * La estrategia NO es adivinar qué quería decir el modelo: es cortar en el
 * último punto donde el objeto todavía es válido. Se prueban las comas de nivel
 * 1 de la última hacia la primera y se devuelve la primera que parsea. Un
 * veredicto a medio camino ("violacion true, sin motivo todavía") es
 * información útil; uno con el motivo inventado no.
 */
function repairTruncated(s) {
    const comas = topLevelCommas(s);

    for (let i = comas.length - 1; i >= 0; i--) {
        const base = s.slice(0, comas[i]).replace(/,\s*$/, '');
        const cand = closeOpen(base);
        try {
            JSON.parse(cand);
            return cand;
        } catch (_) { /* probá el corte anterior */ }
    }

    const cand = closeOpen(s.replace(/,\s*$/, ''));
    try {
        JSON.parse(cand);
        return cand;
    } catch (_) {
        return s;
    }
}

/**
 * Reparaciones conservadoras. Cada una es idempotente y no cambia el
 * significado de un JSON que ya era válido, así que se aplican en cadena sin
 * riesgo.
 */
function repair(raw) {
    let s = String(raw);

    // 1. Comas colgantes antes de } o ]
    s = s.replace(/,\s*([}\]])/g, '$1');

    // 2. Comillas simples como delimitador -> dobles. Solo si el texto no tiene
    //    ninguna comilla doble, para no romper un JSON que ya era válido.
    if (!s.includes('"') && /'[^\n]*'/.test(s)) {
        s = s.replace(/'([^'\\]*(?:\\.[^'\\]*)*)'/g, (_, inner) => `"${inner}"`);
    }

    // 3. Claves sin comillas: { violacion: true } -> { "violacion": true }
    s = s.replace(/([{,]\s*)([A-Za-z_$][\w$]*)(\s*:)/g, '$1"$2"$3');

    // 4. Si sigue sin parsear, es que lo cortaron.
    return repairTruncated(s);
}

/**
 * Busca y parsea el JSON de una respuesta de modelo.
 *
 * @param {string} text Respuesta cruda del modelo.
 * @param {{ validator?: (v:any)=>boolean }} [opts]
 *   validator: si el objeto parseado no lo pasa, se considera que no era el
 *   queTimeouts queríamos y se busca el siguiente candidato.
 * @returns {{ok: boolean, value: any, reason?: string, repaired?: boolean}}
 */
function extractJson(text, { validator } = {}) {
    if (text === null || text === undefined || String(text).trim() === '') return SIN_JSON;

    // 1) El texto tal cual (el caso bueno).
    const directo = tryParse(text, validator);
    if (directo) return directo;

    // 2) Sin cercas de markdown.
    const sinCercas = stripFences(text);
    if (sinCercas !== String(text).trim()) {
        const r = tryParse(sinCercas, validator);
        if (r) return r;
    }

    // 3) Objeto balanceado. Y si hay varios, se prueban TODOS en orden: el
    //    modelo a veces responde con su respuesta y después con un ejemplo.
    const candidatos = balancedCandidates(text);
    for (const cand of candidatos) {
        const limpio = cand.replace(/,\s*([}\]])/g, '$1');
        const r = tryParse(limpio, validator);
        // Si hubo que tocar el texto, se marca como reparado: `repaired` es la
        // señal que usa quien llama para saber que el modelo no obedeció y
        // que toca revisar el prompt o el max_tokens.
        if (r) return limpio === cand ? r : { ...r, repaired: true };
    }

    // 4) Reparación sobre el primer candidato.
    for (const cand of candidatos) {
        const reparado = repair(cand);
        const r = tryParse(reparado, validator);
        if (r) return { ...r, repaired: true };
    }

    return { ...SIN_JSON, reason: 'la respuesta no contenía un JSON válido' };
}

/** Todos los objetos JSON balanceados del texto, en orden de aparición. */
function balancedCandidates(text) {
    const s = stripFences(text);
    const out = [];
    let i = 0;
    while (i < s.length) {
        const rest = s.slice(i);
        const bloque = extractBalanced(rest);
        if (!bloque) break;
        out.push(bloque);
        i += rest.length - bloque.length + 1;
    }
    return out;
}

function tryParse(raw, validator) {
    let value;
    try {
        value = JSON.parse(String(raw).trim());
    } catch {
        return null;
    }

    if (!value || typeof value !== 'object' || Array.isArray(value)) return null;

    // Un objeto SIN campos nunca es la respuesta que queremos. Aparece cuando
    // el texto del modelo tiene llaves sueltas por ahí ("usá {} y {a} en el
    // comando") y aceptarlo haría que el llamador crea que recibió un JSON
    // válido y vacío. Es exactamente el caso "no inventar" que este archivo
    // promete no cubrir.
    if (Object.keys(value).length === 0) return null;

    if (validator && !validator(value)) return null;
    return { ok: true, value, repaired: false };
}

/**
 * Normaliza un valor que debería ser booleano pero el modelo lo mandó como
 * texto. Es más común de lo que parece: "false" con comillas, o "no".
 */
function asBoolean(value, fallback = false) {
    if (typeof value === 'boolean') return value;
    if (typeof value === 'number') return value !== 0;
    if (typeof value === 'string') {
        const s = value.trim().toLowerCase();
        if (['true', 'sí', 'si', 'yes', '1', 'violacion'].includes(s)) return true;
        if (['false', 'no', '0', 'nada', 'limpio', 'ok'].includes(s)) return false;
    }
    return fallback;
}

/** Normaliza un número acotado, tolerando strings ("8", "8/10"). */
function asNumber(value, { min = -Infinity, max = Infinity, fallback = 0 } = {}) {
    let n = value;
    if (typeof n === 'string') n = n.match(/-?\d+(\.\d+)?/)?.[0];
    n = Number(n);
    if (!Number.isFinite(n)) return fallback;
    return Math.max(min, Math.min(max, n));
}

module.exports = {
    extractJson,
    repairTruncated,
    extractBalanced,
    balancedCandidates,
    stripFences,
    repair,
    asBoolean,
    asNumber,
};
