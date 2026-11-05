// scripts/testAiLive.js
// Prueba la IA contra las APIs reales. Gasta cuota de verdad, así que está
// separado de los tests automáticos.
//
//   node scripts/testAiLive.js              # una pregunta
//   node scripts/testAiLive.js "tu pregunta" # la que quieras
//   node scripts/testAiLive.js --moderacion  # prueba el veredicto del automod
//   node scripts/testAiLive.js --todos       # prueba todos los proveedores
//
// Para ver el estado de la cuota en cualquier momento: /botinfo dentro de Discord

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const ai = require('../src/lib/ai');
const aiMod = require('../src/lib/aiModeration');

const args = process.argv.slice(2);
const pregunta = args.find(a => !a.startsWith('--')) || 'Explicame en dos oraciones qué es un rate limit de API';

function linea(char = '─', n = 60) { return char.repeat(n); }

(async () => {
    console.log(`\nProveedores configurados: ${ai.configuredProviders().map(p => `${p.label} [${p.quality}]`).join(' → ')}`);
    console.log(linea('═'));

    // --- 0. Qué modelos acepta MI key -----------------------------------
    // Groq cambia su línea gratis seguido, y adivinar el id del modelo es la
    // forma más fácil de romper todo. Con la key cargada, la API dice cuáles
    // están disponibles.
    if (args.includes('--modelos')) {
        const http = require('../src/lib/http');
        console.log('\n─── Modelos disponibles con tu key ───\n');

        if (process.env.GROQ_API_KEY) {
            try {
                const data = await http.getJson('https://api.groq.com/openai/v1/models', {
                    provider: 'groq',
                    headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}` },
                    timeout: 15000,
                });
                const ids = (data?.data || []).map(m => m.id).sort();
                console.log(`  Groq: ${ids.length} modelos\n`);
                const enLista = new Set(ai.GROQ_MODELS.map(m => m.id));
                for (const id of ids) {
                    const enReserva = enLista.has(id);
                    console.log(`    ${enReserva ? '★' : ' '} ${id}${enReserva ? '   ← en la lista de reserva' : ''}`);
                }
                const sugerencia = ids.find(id => !enLista.has(id) && /qwen|gpt-oss/i.test(id));
                if (sugerencia) {
                    console.log(`\n  Sugerencia para GROQ_MODEL en el .env:`);
                    console.log(`    GROQ_MODEL=${sugerencia}`);
                }
            } catch (e) {
                console.log(`  ✖ Groq: ${e.message.slice(0, 90)}`);
            }
        } else {
            console.log('  No tenés GROQ_API_KEY en el .env.');
        }

        if (process.env.GEMINI_API_KEY) {
            try {
                const data = await http.getJson(
                    `https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`,
                    { provider: 'gemini', timeout: 15000 },
                );
                const ids = (data?.models || [])
                    .filter(m => m.supportedGenerationMethods?.includes('generateContent'))
                    .map(m => m.name.replace('models/', ''))
                    .sort();
                console.log(`\n  Gemini: ${ids.length} modelos\n`);
                for (const id of ids.slice(0, 30)) {
                    const enReserva = ai.GEMINI_MODELS.some(m => m.id === id);
                    console.log(`    ${enReserva ? '★' : ' '} ${id}${enReserva ? '   ← en la lista de reserva' : ''}`);
                }
            } catch (e) {
                console.log(`\n  ✖ Gemini: ${e.message.slice(0, 90)}`);
            }
        } else {
            console.log('\n  No tenés GEMINI_API_KEY en el .env.');
        }
        console.log('\n  ★ = el bot ya lo prueba solo si el primero falla.\n');
        process.exit(0);
    }

    // --- 1. Probar cada proveedor por separado -------------------------
    if (args.includes('--todos')) {
        for (const p of ai.activeProviders()) {
            const t0 = Date.now();
            try {
                const r = await p.run('Decí "OK" y nada más.', { maxTokens: 20 });
                console.log(`  ✔ ${p.label.padEnd(20)} ${Date.now() - t0}ms → ${JSON.stringify(r).slice(0, 50)}`);
            } catch (e) {
                console.log(`  ✖ ${p.label.padEnd(20)} ${e.message.slice(0, 70)}`);
            }
        }
        console.log(linea('═'));
    }

    // --- 2. Una pregunta real -------------------------------------------
    if (args.includes('--moderacion')) {
        console.log('\n─── Veredictos del automod ───\n');
        const casos = [
            { txt: 'sos un idiota, te voy a matar', real: 'violación grave' },
            { txt: 'ayer en la peli le dijeron "morí" y reí todos', real: 'debe ser falso positivo (es una cita)' },
            { txt: 'che boludo, ¿me pasás el link del grupo?', real: 'nada' },
            { txt: 'NO ME ENTONTES más, te voy a matar', real: 'amenaza real' },
        ];
        for (const c of casos) {
            const t0 = Date.now();
            const v = await aiMod.analyze(c.txt, { reason: 'Palabra prohibida' });
            const ms = Date.now() - t0;
            if (!v) {
                console.log(`  ✖ "${c.txt.slice(0, 40)}" → sin veredicto (${ms}ms)`);
            } else {
                const accion = v.esFalsoPositivo ? 'NO borrar' : (aiMod.shouldAutoAct(v) ? 'BORRAR' : 'a humano');
                console.log(`  ${v.esFalsoPositivo ? '✔' : '✖'} "${c.txt.slice(0, 40)}"`);
                console.log(`      ${accion} · ${v.tipo || '-'} · gravedad ${v.gravedad} · ${ms}ms`);
                console.log(`      motivo: ${v.motivo}`);
            }
            console.log(`      (esperado: ${c.real})`);
            console.log('');
        }
    } else {
        console.log(`\n─── Pregunta: ${pregunta} ───\n`);
        const t0 = Date.now();
        try {
            const r = await ai.ask(pregunta, { maxTokens: 400 });
            const ms = Date.now() - t0;
            console.log(r.text);
            console.log(linea('═'));
            console.log(`  proveedor : ${r.providerLabel}`);
            console.log(`  tiempo    : ${ms}ms`);
            console.log(`  cacheada  : ${r.cached ? 'sí' : 'no'}`);
        } catch (e) {
            console.log(`  ✖ ${e.message}`);
        }
    }

    // --- 3. Estado de la cuota ------------------------------------------
    console.log(linea('═'));
    console.log('\n─── Cuota ───\n');
    for (const q of ai.getQuota()) {
        const barra = q.remaining !== null
            ? `[${'█'.repeat(Math.min(10, Math.round((q.remaining / Math.max(1, q.limit || 10)) * 10)))}]`
            : '[sin datos]';
        console.log(`  ${q.label.padEnd(18)} ${barra} ${q.used} usadas · ${q.errors} errores`);
    }
    console.log(`\n  cache: ${ai.cacheSize()} respuestas`);
    console.log(`  cola : ${JSON.stringify(ai.queueStatus())}`);
    console.log('\nPara ver esto dentro de Discord: /botinfo\n');

    process.exit(0);
})();
