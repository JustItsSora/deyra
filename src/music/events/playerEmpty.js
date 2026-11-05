// src/music/events/playerEmpty.js
//
// La cola se vació. Dos destinos posibles: quedarse (24/7) o irse en un rato.
//
// Lo que cambia respecto de antes:
//
//   · el tiempo de espera sale de los ajustes del SERVIDOR (leaveOnEndMs), que
//     antes estaba hardcodeado a 120 s para todos;
//   · el 24/7 se decide mirando los ajustes del server, no un flag de player
//     que ningún comando ponía (player.data.stay247 se leía pero jamás se
//     escribía, así que el modo 24/7 era inalcanzable: /twentyfourseven no
//     existía y nadie más lo seteaba).
//   · si el canal configurado para 24/7 ya no existe, se desactiva solo el 24/7
//     en vez de quedarse mirando un canal fantasma para siempre.

const config = require('../../config');
const { infoPanel } = require('../../lib/panel');
const { safeDestroyPlayer } = require('../utils/playerUtils');
const { getMusicConfig } = require('../lib/musicConfig');

module.exports = {
    name: 'playerEmpty',
    run: async (client, player) => {
        const guild = client.guilds.cache.get(player.guildId);
        if (!guild) return;

        try {
            await client.rest.put(`/channels/${player.voiceId}/voice-status`, {
                body: { status: `usa **${config.PREFIX}play** para agregar canciones` },
            }).catch(() => {});
        } catch (_) {}

        if (player.data.get('playerEmptyProcessed')) return;
        player.data.set('playerEmptyProcessed', true);

        player.data.get('message')?.delete().catch(() => {});
        if (player.queue?.previous) player.queue.previous = [];

        const settings = await getMusicConfig(player.guildId);

        // ── 24/7 ──────────────────────────────────────────────────────────────
        // Solo si el player está en el canal que el admin configuró. Si el
        // player se movió a mano a otro canal, quedarse ahí no es lo pedido.
        const wants247 = settings.twentyFourSeven && settings.voice247Id === player.voiceId;
        if (wants247) {
            const still = await client.channels.fetch(settings.voice247Id).catch(() => null);
            if (!still) {
                // El canal se borró o el bot perdió acceso: se apaga el 24/7
                // para que el cron no intente revivirlo cada 15 minutos para
                // siempre.
                const { updateMusicConfig } = require('../lib/musicConfig');
                await updateMusicConfig(player.guildId, {
                    twentyFourSeven: false,
                    voice247Id: null,
                    text247Id: null,
                }).catch(() => {});
            } else {
                player.data.set('stay247', true);
                return; // se queda esperando, sin temporizador de irse
            }
        }

        player.data.set('stay247', false);

        const vchannel = guild.channels.cache.get(player.voiceId);
        if (!vchannel) return;

        const existingTimeout = player.data.get('disconnectTimeout');
        if (existingTimeout) clearTimeout(existingTimeout);

        const leaveMs = settings.leaveOnEndMs || 120_000;

        const disconnectTimeout = setTimeout(async () => {
            // Puede haberse activado 24/7 o haberse cargado algo mientras
            // esperaba: se revalida antes de irse.
            if (player.data.get('stay247')) return;
            if ((!player.queue || player.queue.size === 0) && !player.playing && !player.paused) {
                client.channels.cache.get(player.textId)?.send(
                    infoPanel('Cola finalizada', 'Me desconecto por inactividad. Usá `/play` cuando quieras seguir escuchando música.'),
                ).catch(() => {});

                await safeDestroyPlayer(player);
            }

            player.data.delete('disconnectTimeout');
        }, leaveMs);

        player.data.set('disconnectTimeout', disconnectTimeout);
    },
};
