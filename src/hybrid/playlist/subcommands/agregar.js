// src/hybrid/playlist/subcommands/agregar.js
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel, warningPanel } = require('../../../lib/panel');
const { requireMusic } = require('../../../music/lib/musicChecks');
const service = require('../../../music/lib/playlistService');
const { limitMessage, isPremium } = require('../../../music/lib/access');

module.exports = {
    async execute(ctx, args = []) {
        if (!requireMusic(ctx)) return;

        const userId = getUserId(ctx);
        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args[0];
        const cancion = isSlash(ctx) ? ctx.options.getString('cancion') : args.slice(1).join(' ');

        if (!name || !cancion) {
            return reply(ctx, {
                ...warningPanel('Faltan datos', 'Uso: `/playlist agregar <playlist> <canción o link>`'),
                ephemeral: true,
            });
        }

        const playlist = await service.getPlaylist(userId, name);
        if (!playlist) {
            return reply(ctx, {
                ...errorPanel('No encontré esa playlist', `No tenés ninguna playlist llamada **${name}**. Usá \`/playlist lista\` para ver las tuyas.`),
                ephemeral: true,
            });
        }

        // Se busca por la consulta del usuario, no por una fila guardada: la
        // idea es "agregá ESTA canción que encontré", no "agregá la que estaba
        // en la lista el mes pasado".
        const result = await ctx.client.music.search(cancion, { requester: ctx.user || ctx.author })
            .catch(() => null);

        if (!result?.tracks?.length) {
            return reply(ctx, {
                ...errorPanel('No encontré la canción', `No hay resultados para **${cancion}**. Probá con el link de YouTube o con título y artista.`),
                ephemeral: true,
            });
        }

        const premium = await isPremium(userId);
        const actuales = await service.getTracks(playlist.id);
        const aviso = limitMessage('playlistSongs', actuales.length + result.tracks.length, premium);
        if (aviso) {
            return reply(ctx, { ...errorPanel('Límite alcanzado', aviso), ephemeral: true });
        }

        const { added, skipped, duplicate } = await service.addTracks(playlist, result.tracks, userId);

        if (!added) {
            return reply(ctx, {
                ...errorPanel('Ya estaba', `**${duplicate[0] || cancion}** ya estaba en **${playlist.name}**.`),
                ephemeral: true,
            });
        }

        const extra = skipped > 0
            ? [`${skipped} ya estaban y se saltaron: ${duplicate.slice(0, 3).join(', ')}.`]
            : [];

        return reply(ctx, successPanel(
            'Agregado a la playlist',
            result.type === 'PLAYLIST'
                ? `Se agregaron **${added}** canciones de **${result.playlistName}** a **${playlist.name}**.`
                : `**${duplicate[0] || result.tracks[0].title}** quedó en **${playlist.name}**.`,
            { lines: [`La playlist tiene ${playlist.trackCount} canciones.`, ...extra] },
        ));
    },
};
