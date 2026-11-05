// src/music/events/playerError.js
const { warningPanel } = require('../../lib/panel');
const { safeDestroyPlayer } = require('../utils/playerUtils');

module.exports = {
    name: 'playerError',
    run: async (client, player, type, error) => {
        try {
            const guild = client.guilds.cache.get(player.guildId);
            if (!guild) return;
            const channel = client.channels.cache.get(player.textId);

            const notify = (title, description) => {
                if (!channel) return;
                channel.send(warningPanel(title, description)).catch(() => {});
            };

            switch (type) {
            case 'TrackStuckEvent':
                if (player.queue.length > 0) {
                    notify('Canción atascada', 'Pasando a la siguiente de la cola.');
                    player.skip();
                    return;
                }
                break;

            case 'TrackLoadFailed':
                if (player.queue.length > 0) {
                    notify('No se pudo cargar la canción', 'Pasando a la siguiente de la cola.');
                    player.skip();
                    return;
                }
                break;

            default:
                notify('Error inesperado', 'Ocurrió un problema con el reproductor. Se reinició la sesión de música.');
                await safeDestroyPlayer(player);
                return;
            }

            await safeDestroyPlayer(player);
        } catch (_) {
            await safeDestroyPlayer(player);
        }
    },
};
