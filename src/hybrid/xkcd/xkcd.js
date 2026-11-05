// /xkcd — tira de xkcd. Con número va a esa tira; sin número, la última.

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { xkcd } = require('../../lib/api/memeApi');
const ui = require('../../lib/ui');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('xkcd')
        .setDescription('Muestra una tira del webcomic xkcd')
        .addIntegerOption(o => o
            .setName('numero')
            .setDescription('Número de tira (sin esto: la última)')
            .setMinValue(1)
            .setMaxValue(3000)
            .setRequired(false)),

    name: 'xkcd',
    aliases: ['tira', 'comic'],
    category: 'diversión',
    cooldownMs: 4000,

    async execute(ctx, args = []) {
        const num = isSlash(ctx) ? ctx.options.getInteger('numero') : parseInt(args[0], 10);
        if (args.length && Number.isNaN(num)) {
            return reply(ctx, ui.missingArgument('Número inválido', 'El número de tira tiene que ser un número entero.', { usage: '/xkcd 2000' }));
        }

        let comic;
        try {
            comic = await xkcd(Number.isFinite(num) && num > 0 ? num : null);
        } catch (err) {
            console.error('[xkcd] Error:', err.message);
            return reply(ctx, ui.error(
                'No pude obtener la tira',
                'xkcd no respondió ahora mismo.',
                { hint: 'Probá con otro número o más tarde.', ephemeral: true },
            ));
        }

        return reply(ctx, ui.imagePayload({
            category: 'diversión',
            icon: '📰',
            kicker: 'xkcd',
            title: `#${comic.num} — ${comic.safe_title || comic.title}`,
            caption: `> ${comic.alt}`,
            media: { url: comic.img, description: comic.title },
            source: 'xkcd',
            sourceUrl: `https://xkcd.com/${comic.num}`,
            callouts: comic.news ? [{ tone: 'muted', text: comic.news }] : undefined,
        }));
    },
};
