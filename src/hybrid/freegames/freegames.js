// /freegames — sorteos de juegos gratis de PC (GamePower).

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { freeGames } = require('../../lib/api/lookupApi');
const ui = require('../../lib/ui');

function timeLeft(endDate) {
    if (!endDate || endDate === 'N/A') return 'Sin fecha';
    const end = Date.parse(endDate);
    if (Number.isNaN(end)) return 'Sin fecha';
    const diff = end - Date.now();
    if (diff <= 0) return 'Terminado';
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    if (days > 0) return `${days}d ${hours}h`;
    return `${hours}h`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('freegames')
        .setDescription('Muestra los sorteos de juegos gratis de PC más valiosos')
        .addIntegerOption(o => o
            .setName('cantidad')
            .setDescription('Cuántos sorteos mostrar (1 a 5, por defecto 3)')
            .setMinValue(1)
            .setMaxValue(5)
            .setRequired(false)),

    name: 'freegames',
    aliases: ['giveaways', 'juegosgratis'],
    category: 'diversión',
    cooldownMs: 8000,

    async execute(ctx, args = []) {
        const amount = isSlash(ctx) ? ctx.options.getInteger('cantidad') : parseInt(args[0], 10);
        const limit = Number.isFinite(amount) && amount > 0 ? Math.min(amount, 5) : 3;

        let games;
        try {
            games = await freeGames({ limit });
        } catch (err) {
            console.error('[freegames] Error:', err.message);
            return reply(ctx, ui.error('No pude obtener los sorteos', 'GamePower no respondió ahora mismo.', { hint: 'Probá en unos minutos.', ephemeral: true }));
        }

        if (!games.length) {
            return reply(ctx, ui.empty('Sin sorteos', 'No hay sorteos disponibles en este momento.'));
        }

        return reply(ctx, ui.imagePayload({
            category: 'diversión',
            icon: '🎮',
            kicker: 'Sorteos de juegos',
            title: `Juegos gratis en PC (${games.length})`,
            caption: 'Ordenados por valor del premio. Los enlaces van a la página del sorteo.',
            media: games.map(g => ({ url: g.image, description: g.title })),
            source: 'GamePower',
            sourceUrl: 'https://www.gamerpower.com/giveaways',
            lists: games.map(g => ({
                title: `${g.title}${g.worth && g.worth !== 'N/A' ? ` — ${g.worth}` : ''}`,
                items: [
                    `Termina en: **${timeLeft(g.end)}**`,
                    g.users ? `Participantes: ${ui.compact(g.users)}` : null,
                    g.platforms ? `Plataformas: ${g.platforms.split(',').map(p => p.trim()).join(', ')}` : null,
                    `[Ir al sorteo](${g.url})`,
                ].filter(Boolean),
            })),
        }));
    },
};
