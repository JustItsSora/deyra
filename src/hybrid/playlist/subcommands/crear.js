// src/hybrid/playlist/subcommands/crear.js
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel, warningPanel } = require('../../../lib/panel');
const service = require('../../../music/lib/playlistService');
const { limitsFor, limitMessage, isPremium } = require('../../../music/lib/access');

module.exports = {
    async execute(ctx, args = []) {
        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args.join(' ');
        const userId = getUserId(ctx);

        if (!name || !name.trim()) {
            return reply(ctx, {
                ...warningPanel('Falta el nombre', 'Uso: `/playlist crear <nombre>`'),
                ephemeral: true,
            });
        }

        // Límite de cantidad de playlists (5 gratis / 15 premium).
        const premium = await isPremium(userId);
        if (!premium) {
            const actuales = await service.listPlaylists(userId);
            const aviso = limitMessage('playlists', actuales.length, premium);
            if (aviso) {
                return reply(ctx, { ...errorPanel('No podés crear más playlists', aviso), ephemeral: true });
            }
        }

        const { playlist, error } = await service.createPlaylist(userId, name);
        if (error) {
            return reply(ctx, { ...errorPanel('No se pudo crear', error), ephemeral: true });
        }

        return reply(ctx, successPanel(
            'Playlist creada',
            `**${playlist.name}** está lista. Agregale canciones con \`/playlist agregar ${playlist.name} <canción>\`.`,
        ));
    },
};
