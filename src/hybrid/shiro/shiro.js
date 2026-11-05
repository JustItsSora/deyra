// Generado por scripts/generateCharacterCommands.js — no editar a mano.
// La fuente real está en src/lib/gifApi.js (CHARACTER_CATEGORIES.shiro).
const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { getCharacterImage } = require('../../lib/gifApi');
const ui = require('../../lib/ui');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shiro')
        .setDescription('Muestra una imagen de shiro de anime'),

    name: 'shiro',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        let image;
        try {
            image = await getCharacterImage('shiro');
        } catch (err) {
            console.error('[shiro] Error:', err.message);
            return reply(ctx, ui.error(
                'No pude obtener la imagen',
                'Ninguna fuente de imágenes respondió ahora mismo.',
                { hint: 'Probá de nuevo en unos segundos.', ephemeral: true },
            ));
        }

        // nekos.best devuelve el AUTOR y el link de pixiv para las imágenes de
        // personaje (waifu/neko/kitsune/husbando); los GIFs de rol no tienen
        // ese dato. Por eso el crédito es condicional.
        const credit = image.author
            ? `De la obra de **${image.author}**.`
            : 'Un personaje para tu colección.';

        return reply(ctx, ui.imagePayload({
            category: 'diversión',
            icon: '⚪',
            kicker: 'Galería de personajes',
            title: 'Shiro',
            caption: credit,
            media: { url: image.url, description: image.author || null },
            source: image.source,
            author: image.author || undefined,
            sourceUrl: image.sourceUrl || undefined,
        }));
    },
};
