// src/hybrid/playlist/subcommands/renombrar.js
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel, warningPanel } = require('../../../lib/panel');
const service = require('../../../music/lib/playlistService');

module.exports = {
    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args[0];
        const nuevo = isSlash(ctx) ? ctx.options.getString('nuevo') : args.slice(1).join(' ');

        if (!name || !nuevo) {
            return reply(ctx, {
                ...warningPanel('Faltan datos', 'Uso: `/playlist renombrar <playlist> <nombre nuevo>`'),
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

        const { error } = await service.renamePlaylist(playlist, nuevo);
        if (error) {
            return reply(ctx, { ...errorPanel('No se pudo renombrar', error), ephemeral: true });
        }

        return reply(ctx, successPanel(
            'Playlist renombrada',
            `Ahora se llama **${playlist.name}**. Las ${playlist.trackCount} canciones siguen en su lugar.`,
        ));
    },
};
