// src/hybrid/playlist/subcommands/lista.js
const { reply, getUserId } = require('../../../lib/reply');
const { infoPanel, warningPanel } = require('../../../lib/panel');
const service = require('../../../music/lib/playlistService');
const { LIMITS } = require('../../../music/lib/access');

module.exports = {
    async execute(ctx) {
        const userId = getUserId(ctx);
        const rows = await service.listPlaylists(userId);

        if (!rows.length) {
            return reply(ctx, {
                ...warningPanel(
                    'Todavía no tenés playlists',
                    'Creá la primera con `/playlist crear <nombre>` y después agregale canciones con `/playlist agregar`.',
                ),
                ephemeral: true,
            });
        }

        const total = rows.reduce((acc, r) => acc + r.trackCount, 0);
        const lines = rows.map((r, i) => `\`${String(i + 1).padStart(2, ' ')}.\` **${r.name}** — ${r.trackCount} canción${r.trackCount === 1 ? '' : 'es'}`);

        return reply(ctx, infoPanel('Tus playlists', lines.join('\n'), {
            lines: [
                `**${rows.length}** playlist${rows.length === 1 ? '' : 's'} • **${total}** canción${total === 1 ? '' : 'es'} en total`,
                `Límite gratis: ${LIMITS.free.playlists} playlists. Con premium: ${LIMITS.premium.playlists}.`,
            ],
        }));
    },
};
