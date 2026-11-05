// src/hybrid/playlist/subcommands/mover.js
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel, warningPanel } = require('../../../lib/panel');
const service = require('../../../music/lib/playlistService');

module.exports = {
    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args[0];
        const desde = isSlash(ctx) ? ctx.options.getInteger('desde') : parseInt(args[1], 10);
        const hasta = isSlash(ctx) ? ctx.options.getInteger('hasta') : parseInt(args[2], 10);

        if (!name || !desde || !hasta) {
            return reply(ctx, {
                ...warningPanel('Faltan datos', 'Uso: `/playlist mover <playlist> <posición actual> <posición nueva>`'),
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

        const { moved, error } = await service.moveTrack(playlist, desde, hasta);
        if (error) {
            return reply(ctx, { ...errorPanel('No se pudo mover', error), ephemeral: true });
        }

        return reply(ctx, successPanel(
            'Canción movida',
            `**${moved.title}** pasó de la posición ${desde} a la ${hasta} en **${playlist.name}**.`,
        ));
    },
};
