// src/hybrid/playlist/subcommands/canciones.js
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { infoPanel, errorPanel, warningPanel } = require('../../../lib/panel');
const { formatDuration, cleanAuthorName, truncateTitle } = require('../../../music/lib/trackFormat');
const service = require('../../../music/lib/playlistService');

const MAX_LINEAS = 20;

module.exports = {
    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args.join(' ');

        if (!name) {
            return reply(ctx, {
                ...warningPanel('Falta el nombre', 'Uso: `/playlist canciones <playlist>`'),
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

        const rows = await service.getTracks(playlist.id);
        if (!rows.length) {
            return reply(ctx, {
                ...warningPanel('La playlist está vacía', `Agregale canciones con \`/playlist agregar ${playlist.name} <canción>\`.`),
                ephemeral: true,
            });
        }

        const lineas = rows.slice(0, MAX_LINEAS).map((row, i) => {
            const pos = i + 1;
            const dur = formatDuration(row.length);
            const link = row.uri ? `[${truncateTitle(row.title, 42)}](${row.uri})` : truncateTitle(row.title, 42);
            return `\`${String(pos).padStart(2, ' ')}.\` ${link} — ${cleanAuthorName(row.author, 20)} \`${dur}\``;
        });

        const resto = rows.length - MAX_LINEAS;
        const duracionTotal = rows.reduce((acc, r) => acc + (r.length || 0), 0);

        return reply(ctx, infoPanel(`Playlist: ${playlist.name}`, lineas.join('\n'), {
            lines: [
                `**${rows.length}** canción${rows.length === 1 ? '' : 'es'} • duración total \`${formatDuration(duracionTotal)}\``,
                resto > 0 ? `…y ${resto} más.` : '',
                `Reproducirla: \`/playlist reproducir ${playlist.name}\``,
            ].filter(Boolean),
        }));
    },
};
