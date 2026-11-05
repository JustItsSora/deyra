// /level leaderboard — top de XP del servidor, paginado.
//
// Antes mandaba los 10 primeros en un solo bloque de texto, sin indicar cuántos
// hay en total ni dónde quedó el usuario que preguntó. Ahora: ranking con
// posiciones destacadas, barra relativa al primer lugar, y paginación.

const { reply, getUserId } = require('../../../lib/reply');
const { Leveling } = require('../../../data/models');
const { createPaginationSession } = require('../../../lib/pagination');
const ui = require('../../../lib/ui');

const PER_PAGE = 10;
const MEDALS = ['🥇', '🥈', '🥉'];

module.exports = {
    async execute(ctx) {
        const top = await Leveling.findAll({
            where: { guildId: ctx.guild.id },
            order: [['xp', 'DESC']],
            limit: 100,
        });

        if (!top.length) {
            return reply(ctx, ui.empty(
                'Nadie tiene XP todavía',
                'El ranking se arma solo con los mensajes que envía la gente.',
                { hint: 'Que alguien escriba un par de mensajes y volvé a consultar.' },
            ));
        }

        const topXp = Math.max(1, Number(top[0].xp));
        const userId = getUserId(ctx);
        const meIndex = top.findIndex(r => r.userId === userId);
        const myXp = meIndex >= 0 ? Number(top[meIndex].xp) : 0;

        const pages = Math.ceil(top.length / PER_PAGE);

        const renderPage = (pageIndex) => {
            const start = pageIndex * PER_PAGE;
            const slice = top.slice(start, start + PER_PAGE);

            const lines = slice.map((record, i) => {
                const pos = start + i + 1;
                const xp = Number(record.xp);
                const bar = ui.progressBar(xp, topXp, { size: 8, style: 'rounded' });
                const user = ctx.client.users.cache.get(record.userId);
                const name = user ? user.username : `<@${record.userId}>`;
                const rank = MEDALS[pos - 1] || `${String(pos).padStart(2, ' ')}.`;
                return `${rank} ${name}\n   ${bar} ${ui.compact(xp)} XP`;
            });

            return ui.buildOne({
                category: 'niveles',
                kicker: 'Top de niveles',
                title: meIndex >= 0 ? `Tu puesto: #${meIndex + 1} de ${top.length}` : 'Top de niveles',
                icon: '🏆',
                description: meIndex >= 0
                    ? `Tenés **${ui.compact(myXp)} XP**. Usá los botones para ver el resto del ranking.`
                    : `Mostrando los ${top.length} usuarios con más XP de este servidor.`,
                fields: [ui.code(lines.join('\n\n'))],
                footerText: `Página ${pageIndex + 1} de ${pages} · ${top.length} usuarios con XP`,
            });
        };

        // La paginación reusa el helper genérico: mismo comportamiento de
        // botones (primera/anterior/siguiente/última) y mismo aviso para quien
        // intenta tocar los botones de otro.
        return createPaginationSession({
            interactionOrMessage: ctx,
            pages: Array.from({ length: pages }, (_, i) => i),
            userId,
            renderPage: (pageIndex) => renderPage(pageIndex),
        }).renderInitial();
    },
};
