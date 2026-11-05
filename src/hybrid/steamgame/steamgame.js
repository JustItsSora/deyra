// /steamgame — ficha de un juego por su App ID de Steam (SteamSpy, sin key).
// El App ID es el número en la URL de la tienda: steamcommunity.com/app/730

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { steamGame } = require('../../lib/api/lookupApi');
const ui = require('../../lib/ui');

function reviewMeter(rating) {
    if (rating === null) return null;
    return { label: 'Valoraciones', value: rating, max: 100, suffix: '%' };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('steamgame')
        .setDescription('Muestra la ficha de un juego de Steam por su App ID')
        .addStringOption(o => o
            .setName('appid')
            .setDescription('App ID de Steam (ej: 730 para Counter-Strike)')
            .setRequired(true)),

    name: 'steamgame',
    aliases: ['steam', 'appid'],
    category: 'diversión',
    cooldownMs: 5000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('appid') : args.join('');
        // Aceptamos la URL completa de la tienda, no solo el número.
        const appId = String(raw || '').match(/(\d{3,8})/)?.[1];

        if (!appId) {
            return reply(ctx, ui.missingArgument(
                'App ID inválido',
                'Pasame el número que aparece en la URL de la tienda, o la URL completa.',
                { usage: '/steamgame 730' },
            ));
        }

        let game;
        try {
            game = await steamGame(appId);
        } catch (err) {
            if (err.notFound) {
                return reply(ctx, ui.empty('Juego no encontrado', `Steam no tiene nada con el App ID **${appId}**.`));
            }
            console.error('[steamgame] Error:', err.message);
            return reply(ctx, ui.error('No pude consultar SteamSpy', 'La fuente no respondió.', { ephemeral: true }));
        }

        return reply(ctx, ui.payload({
            category: 'diversión',
            icon: '🎮',
            kicker: 'Steam',
            title: game.name,
            description: [game.developer, game.publisher].filter(Boolean).join(' · ') || null,
            grid: [
                ['Género', game.genre || '—'],
                ['Precio', game.price],
                ['Propietarios', game.owners ? ui.compact(game.owners) : '—'],
                ['Positivas', ui.compact(game.positive)],
                ['Negativas', ui.compact(game.negative)],
                ['App ID', appId],
            ],
            meters: [reviewMeter(game.rating)].filter(Boolean),
            callouts: [{ tone: 'muted', text: `[Ver en la tienda de Steam](${game.url})` }],
            footerText: 'Datos: SteamSpy',
        }));
    },
};
