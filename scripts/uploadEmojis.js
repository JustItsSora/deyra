// scripts/uploadEmojis.js
//
// Sube automáticamente todos los assets listados en emojiCatalog.js como
// "Application Emojis" (Discord Developer Portal → tu app → Emojis).
// A diferencia de los emojis de servidor, estos pertenecen a la APLICACIÓN,
// así que Deyra puede usarlos en CUALQUIER servidor donde esté presente,
// sin gastar slots de emoji de ese servidor.
//
// Qué hace:
//   1. Lee el catálogo (scripts/emojiCatalog.js).
//   2. Consulta qué emojis ya existen en la app (GET /applications/{id}/emojis)
//      para no volver a subir uno que ya está — Discord rechaza nombres duplicados.
//   3. Sube (PUT/POST) los que faltan, en base64, respetando el rate limit.
//   4. Detecta el ID y nombre reales que Discord asigna a cada emoji subido.
//   5. Escribe todo (key -> {id, name, animated}) en src/data/emojiCache.json,
//      que es lo que el bot lee en runtime a través de src/lib/emojis.js.
//
// Uso: npm run emojis:upload   (requiere BOT_TOKEN y CLIENT_ID en .env)

require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { CATALOG, ASSETS_DIR } = require('./emojiCatalog');

const BOT_TOKEN = process.env.BOT_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const API_BASE = 'https://discord.com/api/v10';
const CACHE_PATH = path.join(__dirname, '..', 'src', 'data', 'emojiCache.json');

function assertEnv() {
    const missing = [];
    if (!BOT_TOKEN) missing.push('BOT_TOKEN');
    if (!CLIENT_ID) missing.push('CLIENT_ID');
    if (missing.length) {
        console.error(`[emojis] Faltan variables de entorno: ${missing.join(', ')}. Revisa tu .env.`);
        process.exit(1);
    }
}

function mimeFor(file) {
    return file.endsWith('.gif') ? 'image/gif' : 'image/png';
}

async function discordRequest(method, endpoint, body) {
    const res = await fetch(`${API_BASE}${endpoint}`, {
        method,
        headers: {
            Authorization: `Bot ${BOT_TOKEN}`,
            'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
    });

    // Respeta rate limits: Discord devuelve retry_after en segundos.
    if (res.status === 429) {
        const data = await res.json().catch(() => ({ retry_after: 1 }));
        const waitMs = Math.ceil((data.retry_after || 1) * 1000) + 250;
        console.warn(`[emojis] Rate limited, esperando ${waitMs}ms...`);
        await new Promise(r => setTimeout(r, waitMs));
        return discordRequest(method, endpoint, body);
    }

    const text = await res.text();
    let data;
    try { data = text ? JSON.parse(text) : {}; } catch { data = { raw: text }; }

    if (!res.ok) {
        const err = new Error(`Discord API ${res.status} on ${method} ${endpoint}: ${JSON.stringify(data)}`);
        err.status = res.status;
        err.data = data;
        throw err;
    }
    return data;
}

async function listExistingEmojis() {
    const data = await discordRequest('GET', `/applications/${CLIENT_ID}/emojis`);
    // La respuesta trae { items: [...] }
    return data.items || [];
}

async function uploadEmoji(entry) {
    const filePath = path.join(ASSETS_DIR, entry.file);
    if (!fs.existsSync(filePath)) {
        throw new Error(`Archivo no encontrado: ${filePath}`);
    }
    const buffer = fs.readFileSync(filePath);
    const base64 = buffer.toString('base64');
    const dataUri = `data:${mimeFor(entry.file)};base64,${base64}`;

    const created = await discordRequest('POST', `/applications/${CLIENT_ID}/emojis`, {
        name: entry.name,
        image: dataUri,
    });

    return created; // { id, name, animated, ... }
}

async function main() {
    assertEnv();
    console.log(`[emojis] Subiendo ${CATALOG.length} emojis al Developer Portal de la aplicación ${CLIENT_ID}...`);

    const existing = await listExistingEmojis();
    const existingByName = new Map(existing.map(e => [e.name, e]));

    const result = {}; // key -> { id, name, animated }
    let uploaded = 0;
    let skipped = 0;
    let failed = 0;

    for (const entry of CATALOG) {
        try {
            const already = existingByName.get(entry.name);
            if (already) {
                // Ya existe en el portal: solo detectamos su ID/nombre real, no lo resubimos.
                result[entry.key] = {
                    id: already.id,
                    name: already.name,
                    animated: !!already.animated,
                };
                console.log(`[emojis] = ${entry.name} ya existía (id ${already.id}), detectado.`);
                skipped++;
                continue;
            }

            const created = await uploadEmoji(entry);
            result[entry.key] = {
                id: created.id,
                name: created.name,
                animated: !!created.animated,
            };
            console.log(`[emojis] + ${entry.name} subido (id ${created.id}).`);
            uploaded++;

            // Pequeño respiro entre subidas para no golpear el rate limit global.
            await new Promise(r => setTimeout(r, 350));
        } catch (err) {
            console.error(`[emojis] x Falló ${entry.name}: ${err.message}`);
            failed++;
        }
    }

    fs.mkdirSync(path.dirname(CACHE_PATH), { recursive: true });
    fs.writeFileSync(CACHE_PATH, JSON.stringify(result, null, 2));

    console.log('');
    console.log(`[emojis] Listo. Subidos: ${uploaded} · Detectados existentes: ${skipped} · Fallidos: ${failed}`);
    console.log(`[emojis] Cache escrito en ${CACHE_PATH}`);
    if (failed > 0) {
        console.log('[emojis] Revisa los errores arriba — probablemente nombres duplicados fuera de este catálogo o formato/tamaño inválido (máx 256KB, 32 chars el nombre).');
        process.exitCode = 1;
    }
}

main().catch(err => {
    console.error('[emojis] Error fatal:', err);
    process.exit(1);
});
