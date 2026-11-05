// src/hybrid/playlist/subcommands/quitar.js
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel, warningPanel } = require('../../../lib/panel');
const service = require('../../../music/lib/playlistService');

module.exports = {
    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args[0];
        const pos = isSlash(ctx) ? ctx.options.getInteger('posicion') : parseInt(args[1], 10);

        if (!name || !pos) {
            return reply(ctx, {
                ...warningPanel('Faltan datos', 'Uso: `/playlist quitar <playlist> <posición>`\nLa posición se ve en `/playlist canciones`.'),
                ephemeral: true,
            });
        }

        const playlist = await service.getPlaylist(userId, name);
        if (!playlist) {
            return reply(ctx, {
                ...errorPanel('No encontré esa playlist', `No tenés ninguna playlist llamada **${name}**.`),
                ephemeral: true,
            });
        }

        const { removed } = await service.removeAtPosition(playlist, pos);
        if (!removed) {
            return reply(ctx, {
                ...errorPanel('Posición inválida', `**${playlist.name}** tiene ${playlist.trackCount} canciones, así que la posición ${pos} no existe.`),
                ephemeral: true,
            });
        }

        return reply(ctx, successPanel(
            'Quitada de la playlist',
            `**${removed.title}** salió de **${playlist.name}**.`,
            { lines: [`Quedan ${playlist.trackCount} canciones.`] },
        ));
    },
};
