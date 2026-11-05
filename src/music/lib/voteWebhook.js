// src/music/lib/voteWebhook.js
//
// Receptor de votos de top.gg.
//
// POR QUÉ ESTO EXISTE: el esquema de "votá en top.gg para desbloquear funciones"
// necesita saber quién votó, y top.gg no te avisa. Hay que configurar un webhook
// en el panel de top.gg que apunte a algún lado. Ese "algún lado" es un
// servidor HTTP, porque Discord no puede recibir webhooks externos.
//
// Implementación: servidor HTTP nativo de Node (node:http), sin express ni
// ninguna dependencia nueva. Es exactamente lo que hacía el bot de música viejo
// (src/server/server.ts) con un puerto configurable, así que el setup en top.gg
// es el mismo: url del webhook + secreto.
//
// SEGURIDAD — lo único que importa acá:
//
//   · HMAC-SHA256 del cuerpo crudo con el secreto, en el formato
//     `t=<unix>,v1=<hex>` que manda top.gg (Standard Webhooks).
//   · Comparación con timingSafeEqual, NO con `===`: un `===` sobre hex permite
//     a un atacante descubrir el HMAC válido de a un caracter por respuesta
//     (timing attack). Node tira si los buffers tienen distinto largo, así que
//     primero se comparan los largos.
//   · Ventana de 5 minutos para el timestamp: sin ella, un HMAC capturado
//     sirve para siempre y se puede reenviar.
//   · El secreto NUNCA va en el código ni en el repo: se lee de
//     TOPGG_WEBHOOK_SECRET del .env.
//
// Si no hay secreto configurado, el servidor ni siquiera arranca: es mejor
// quedarse sin voto que quedar con el endpoint abierto.

const http = require('http');
const crypto = require('crypto');
const { MusicVote } = require('../../data/models');

const MAX_TIMESTAMP_SKEW_MS = 5 * 60_000;
const MAX_BODY_BYTES = 64 * 1024;

/**
 * Valida la firma `t=<unix>,v1=<hex>` de top.gg sobre el cuerpo CRUDO.
 * @returns {{ok: boolean, reason?: string}}
 */
function verifySignature(rawBody, header, secret) {
    if (!header) return { ok: false, reason: 'Falta el header de firma.' };

    const parts = String(header).split(',');
    const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2);
    const signature = parts.find((p) => p.startsWith('v1='))?.slice(3);

    if (!timestamp || !signature) return { ok: false, reason: 'Header de firma con formato raro.' };

    const ts = parseInt(timestamp, 10);
    if (!Number.isFinite(ts)) return { ok: false, reason: 'Timestamp ilegible.' };

    if (Math.abs(Date.now() - ts * 1000) > MAX_TIMESTAMP_SKEW_MS) {
        return { ok: false, reason: 'Firma vieja (más de 5 minutos).' };
    }

    const esperado = crypto
        .createHmac('sha256', secret)
        .update(`${timestamp}.${rawBody}`)
        .digest('hex');

    const a = Buffer.from(esperado, 'utf8');
    const b = Buffer.from(signature, 'utf8');

    if (a.length !== b.length) return { ok: false, reason: 'Firma inválida.' };
    if (!crypto.timingSafeEqual(a, b)) return { ok: false, reason: 'Firma inválida.' };

    return { ok: true };
}

/** Lee el cuerpo como texto, con tope de tamaño. */
function readBody(req) {
    return new Promise((resolve, reject) => {
        let data = '';
        let size = 0;

        req.on('data', (chunk) => {
            size += chunk.length;
            if (size > MAX_BODY_BYTES) {
                reject(new Error('Cuerpo demasiado grande.'));
                req.destroy();
                return;
            }
            data += chunk;
        });
        req.on('end', () => resolve(data));
        req.on('error', reject);
    });
}

function send(res, status, text) {
    res.writeHead(status, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(text);
}

/**
 * Registra un voto. Idempotente por `lastVoteId`: top.gg reintenta el webhook si
 * no recibe un 2xx, y sin este chequeo el mismo voto se contaría dos veces (y el
 * voteCount del usuario queda mal para siempre).
 */
async function recordVote({ userId, topggUserId, voteId, weight, votedAt, expiresAt }) {
    const existing = await MusicVote.findOne({ where: { userId } });

    if (existing && existing.lastVoteId === voteId) {
        return { duplicate: true };
    }

    const row = {
        userId,
        lastVoteId: voteId,
        lastVotedAt: votedAt ? new Date(votedAt) : new Date(),
        expiresAt: expiresAt ? new Date(expiresAt) : new Date(Date.now() + 12 * 60 * 60 * 1000),
        weight: Number.isFinite(weight) ? weight : 1,
        voteCount: (existing?.voteCount || 0) + 1,
    };

    if (existing) await existing.update(row);
    else await MusicVote.create(row);

    return { duplicate: false };
}

/**
 * Arranca el servidor del webhook.
 * @returns {{server: http.Server, close: () => Promise<void>}|null} null si no
 *          hay secreto configurado (y en ese caso no se arranca nada).
 */
function startVoteWebhook(client, { port, secret }) {
    if (!secret) {
        console.log('[votes] Webhook de top.gg desactivado (falta TOPGG_WEBHOOK_SECRET en el .env).');
        return null;
    }

    const server = http.createServer(async (req, res) => {
        const path = (req.url || '').split('?')[0];

        if (path !== '/webhooks/topgg' || req.method !== 'POST') {
            return send(res, 404, 'Not found');
        }

        let raw;
        try {
            raw = await readBody(req);
        } catch {
            return send(res, 413, 'Payload too large');
        }

        const check = verifySignature(raw, req.headers['x-topgg-signature'], secret);
        if (!check.ok) {
            console.warn(`[votes] Firma rechazada: ${check.reason}`);
            // 401 y no 200: top.gg reintenta, y está bien que reintente, porque
            // esta petición no era legítima.
            return send(res, 401, 'Invalid signature');
        }

        let payload;
        try {
            payload = JSON.parse(raw);
        } catch {
            return send(res, 400, 'Bad JSON');
        }

        if (payload.type === 'webhook.test') {
            console.log('[votes] Webhook verificado por top.gg correctamente.');
            return send(res, 200, 'OK');
        }

        if (payload.type !== 'vote.create') {
            // Se responde 200 igual: un tipo desconocido no es un error nuestro
            // y hacer que top.gg reintente un evento que no vamos a procesar
            // solo genera ruido.
            return send(res, 200, 'Ignored');
        }

        try {
            const user = payload.user || {};
            const userId = user.platform_id;
            if (!userId) return send(res, 400, 'Missing platform_id');

            const result = await recordVote({
                userId: String(userId),
                topggUserId: user.id,
                voteId: String(payload.data?.id || `${Date.now()}`),
                weight: payload.data?.isWeekend ? 0.5 : 1,
                votedAt: payload.data?.created_at,
                expiresAt: payload.data?.expires_at,
            });

            console.log(`[votes] Voto de ${userId}: ${result.duplicate ? 'duplicado, ignorado' : 'registrado'}.`);
            return send(res, 200, 'OK');
        } catch (err) {
            console.error('[votes] Error registrando el voto:', err.message);
            // 500 para que top.gg reintente: perder un voto es peor que un
            // reintento.
            return send(res, 500, 'Error');
        }
    });

    server.listen(port, () => {
        console.log(`[votes] Webhook de top.gg escuchando en http://0.0.0.0:${port}/webhooks/topgg`);
    });

    return {
        server,
        close: () => new Promise((resolve) => server.close(resolve)),
    };
}

module.exports = { startVoteWebhook, verifySignature, recordVote, MAX_TIMESTAMP_SKEW_MS };
