// src/hybrid/playlist/subcommands/borrar.js
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel, warningPanel } = require('../../../lib/panel');
const service = require('../../../music/lib/playlistService');

module.exports = {
    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args.join(' ');

        const playlist = await service.getPlaylist(userId, name);
        if (!playlist) {
            return reply(ctx, {
                ...errorPanel('No encontré esa playlist', `No tenés ninguna playlist llamada **${name}**.`),
                ephemeral: true,
            });
        }

        // Esto borra filas de la base de forma irreversible, así que el
        // comando de texto pide confirmación escribiendo BORRAR. El slash no
        // puede (no hay modal barato para eso) y por eso se avisa con la
        // cantidad de canciones que se van a perder.
        if (!isSlash(ctx)) {
            const confirmacion = (args.slice(1).join(' ') || '').toUpperCase();
            if (confirmacion !== 'BORRAR') {
                return reply(ctx, {
                    ...warningPanel(
                        'Confirmación necesaria',
                        `Esto borra **${playlist.name}** y sus ${playlist.trackCount} canción${playlist.trackCount === 1 ? '' : 'es'} para siempre.\nRepetí el comando con BORRAR: \`!playlist borrar ${playlist.name} BORRAR\``,
                    ),
                    ephemeral: true,
                });
            }
        } else if (playlist.trackCount > 0) {
            return reply(ctx, {
                ...warningPanel('Confirmá que querés borrarla', `**${playlist.name}** tiene ${playlist.trackCount} canción${playlist.trackCount === 1 ? '' : 'es'}. Si igual la querés borrar, volvé a ejecutar el comando.`),
                ephemeral: true,
            });
        }

        const total = playlist.trackCount;
        await service.deletePlaylist(playlist);

        return reply(ctx, successPanel(
            'Playlist borrada',
            `**${playlist.name}** y sus ${total} canción${total === 1 ? '' : 'es'} ya no están.`,
        ));
    },
};
