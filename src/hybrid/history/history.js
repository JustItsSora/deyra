// src/hybrid/history/history.js
//
// Historial de reproducción.
//
// QUÉ CAMBIÓ con la fusión: antes leía `player.data.history`, que es un Map en
// memoria. Eso significaba que el historial:
//   · se vaciaba en cada playerDestroy (o sea, en cada /stop y en cada cancion
//     terminada con cola vacía),
//   · se perdía en cada reinicio del bot,
//   · solo tenía las canciones de la sesión actual, como mucho 20.
// Ahora sale de la tabla music_history (ver src/music/lib/history.js), que
// guarda cada canción que sonó y sobrevive reinicios. El comando muestra las de
// TU usuario; con `--server` muestra las de todo el server.
//
// La paginación va por botones persistentes (historyHandler.js) y no por un
// collector de 30 segundos como antes: el panel se quedaba muerto justo cuando
// alguien lo estaba mirando.

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, warningPanel } = require('../../lib/panel');
const { formatDuration, cleanAuthorName, truncateTitle } = require('../../music/lib/trackFormat');
const { getUserHistory, getGuildHistory } = require('../../music/lib/history');
const { LIMITS } = require('../../music/lib/access');

const PER_PAGE = 10;

function buildPanel(rows, { page, total, pageCount, scope, title }) {
    const lineas = rows.map((row, i) => {
        const n = page * PER_PAGE + i + 1;
        const link = row.uri ? `[${truncateTitle(row.title, 42)}](${row.uri})` : truncateTitle(row.title, 42);
        const cuando = row.playedAt ? `\`${new Date(row.playedAt).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}\`` : '';
        return `\`${String(n).padStart(2, ' ')}.\` ${link} — ${cleanAuthorName(row.author, 18)} \`${formatDuration(row.length)}\` ${cuando}`;
    });

    const nav = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`history_page_${scope}_${Math.max(0, page - 1)}`)
            .setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(page === 0),
        new ButtonBuilder()
            .setCustomId(`history_page_${scope}_${Math.min(pageCount - 1, page + 1)}`)
            .setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(page >= pageCount - 1),
    );

    return infoPanel(title, lineas.join('\n'), {
        rows: [nav],
        lines: [
            `**${total}** canción${total === 1 ? '' : 'es'} • página ${page + 1} de ${pageCount}`,
            scope === 'server' ? 'Historial de todo el servidor.' : `Se guardan las últimas ${LIMITS.free.history} (gratis) o ${LIMITS.premium.history} (premium).`,
        ],
    });
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('history')
        .setDescription('Muestra las canciones que escuchaste')
        .addBooleanOption(o => o.setName('server').setDescription('Ver el historial de todo el servidor en vez del tuyo')),

    name: 'history',
    aliases: ['recent', 'recientes', 'historial'],
    category: 'música',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        const delServer = isSlash(ctx)
            ? (ctx.options.getBoolean('server') || false)
            : ['server', 'servidor'].includes((args[0] || '').toLowerCase());

        const scope = delServer ? 'server' : 'user';
        const page = 0;

        const rows = delServer
            ? await getGuildHistory(ctx.guild.id, 500)
            : await getUserHistory(userId, 500);

        if (!rows.length) {
            return reply(ctx, {
                ...warningPanel(
                    'Historial vacío',
                    delServer
                        ? 'Todavía no hay canciones registradas en este servidor.'
                        : 'Todavía no escuchaste nada. Apenas termine una canción aparece acá.',
                ),
                ephemeral: true,
            });
        }

        const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));

        return reply(ctx, buildPanel(rows.slice(0, PER_PAGE), {
            page,
            total: rows.length,
            pageCount,
            scope,
            title: delServer ? 'Reproducidas en el server' : 'Tu historial',
        }));
    },
};

module.exports.buildPanel = buildPanel;
module.exports.PER_PAGE = PER_PAGE;
