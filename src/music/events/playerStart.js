// src/music/events/playerStart.js
//
// Arranca una canción. Acá pasan tres cosas que antes no pasaban:
//
//   1. Se manda el panel de reproducción (src/music/ui/playerPanel.js) en vez
//      de un Container armado a mano acá. El mismo panel lo usan /nowplaying y
//      el musicHandler cuando alguien aprieta un botón, así que los tres
//      lugares se ven iguales y se arreglan juntos.
//
//   2. NO se monta ningún collector. Los botones los maneja
//      src/gateway/interactions/musicHandler.js, que es persistente. Antes
//      este archivo creaba un collector por canción con vida de 5-15 minutos:
//      el panel dejaba de responder mientras la música seguía sonando.
//
//   3. Se reaplica el filtro activo. Lavalink no arrastra los filtros de una
//      pista a la siguiente, así que sin esto /filter nightcore se escuchaba en
//      una canción y en la siguiente volvía al sonido normal, sin avisar.

const { getMusicConfig, applySettingsToPlayer } = require('../lib/musicConfig');
const { reapplyIfActive } = require('../filters');
const { playerPanelPayload } = require('../ui/playerPanel');
const { recordHistory } = require('../lib/history');

async function updateVoiceStatus(client, player, track) {
    try {
        if (!player.voiceId || player.state === 'DESTROYED' || player.state === 'DISCONNECTED') return;
        // El estado de voz tiene tope de 500 caracteres: un título largo lo
        // rompe y el request falla entero.
        await client.rest.put(`/channels/${player.voiceId}/voice-status`, {
            body: { status: `🎵 ${track.title}`.slice(0, 500) },
        }).catch(() => {});
    } catch (_) {}
}

module.exports = {
    name: 'playerStart',
    run: async (client, player, track) => {
        try {
            const currentTrack = track || player.queue?.current;
            if (!currentTrack) return;

            // El server pudo cambiar los ajustes con el player ya vivo (un admin
            // activa fairplay o 24/7 mientras suena), así que se re-leen.
            const settings = await getMusicConfig(player.guildId);
            applySettingsToPlayer(player, settings);

            player.data?.delete('playerEmptyProcessed');
            player.data?.set('currentTrack', currentTrack);
            player.data?.set('startedAt', Date.now());

            // Historial persistente: sobrevive reinicios, y /history lo lee de
            // acá. El de memoria (player.data.history) sigue existiendo para
            // /previous, que necesita la pista exacta tal como se reprodujo.
            recordHistory(player, currentTrack).catch(() => {});

            const filter = reapplyIfActive(player);

            // Lavalink trae su propio autoplay, independiente del de Deyra (que
            // vive en playerEnd.js y busca canciones parecidas). Con los dos
            // prendidos Lavalink reinicia la pista Y Deyra agrega otra, y
            // quedan dos sonando. Se apaga explícitamente el de Lavalink para
            // que haya una sola fuente de verdad.
            const lava = player.shoukaku || player;
            if (typeof lava.setAutoplay === 'function') {
                lava.setAutoplay(false).catch(() => {});
            }

            await updateVoiceStatus(client, player, currentTrack);

            // Un servidor puede apagar el panel (setting nowPlayingPanel):
            // en modo 24/7 o con el bot en un canal de voz vacío, el panel en
            // el texto cada canción es ruido.
            if (!settings.nowPlayingPanel) return;

            const oldMessage = player.data?.get('message');
            if (oldMessage) oldMessage.delete().catch(() => {});

            const channel = client.channels.cache.get(player.textId);
            if (!channel?.send) return;

            const message = await channel.send(playerPanelPayload(player)).catch(() => null);
            if (!message) return;

            player.data?.set('message', message);
            player.data?.set('panelFilter', filter ? 'reaplicado' : null);
        } catch (err) {
            console.error('[playerStart] Error:', err.message);
        }
    },
};
