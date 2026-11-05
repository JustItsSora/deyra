// src/music/events/playerException.js
const { warningPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    name: 'playerException',
    run: async (client, player, reason) => {
        try {
            const guild = client.guilds.cache.get(player.guildId);
            if (!guild) return;
            const channel = client.channels.cache.get(player.textId);
            const currentTrack = player.queue.current;

            if (reason?.exception?.cause?.includes('ScriptExtractionException') && currentTrack) {
                const searchQuery = `${currentTrack.title} ${currentTrack.author}`;
                const engines = ['ytmsearch', 'spsearch', 'scsearch'];
                let searchResult = { tracks: [] };

                for (const engine of engines) {
                    searchResult = await client.music.search(searchQuery, { engine, requester: currentTrack.requester }).catch(() => ({ tracks: [] }));
                    if (searchResult.tracks.length > 0) break;
                }

                if (searchResult.tracks.length > 0) {
                    if (channel) {
                        channel.send(warningPanel('Fuente restringida', 'YouTube bloqueó esta canción — buscando en una fuente alternativa.')).catch(() => {});
                    }

                    player.queue.unshift(searchResult.tracks[0]);
                    player.skip();
                    return;
                }

                if (channel) {
                    channel.send(errorPanel('No se pudo reproducir', 'La fuente está bloqueada. Pasando a la siguiente canción.')).catch(() => {});
                }

                if (player.queue.length > 0) player.skip();
                return;
            }

            if (player && player.state !== 'DESTROYED') {
                if (channel) {
                    channel.send(warningPanel('Error de reproducción', 'Ocurrió un problema al reproducir. Pasando a la siguiente canción...')).catch(() => {});
                }

                if (player.queue.length > 0) player.skip();
            }
        } catch (_) {}
    },
};
