const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

// meme-api.com — memes aleatorios de Reddit, gratis, sin key.
async function fetchMeme() {
    const res = await fetch('https://meme-api.com/gimme');
    if (!res.ok) throw new Error(`meme-api ${res.status}`);
    const data = await res.json();
    if (!data.url) throw new Error('Sin meme en la respuesta');
    return { url: data.url, title: data.title };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('memegen')
        .setDescription('Muestra un meme aleatorio'),

    name: 'memegen',
    aliases: ['meme'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        let meme;
        try {
            meme = await fetchMeme();
        } catch (err) {
            console.error('[memegen] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener un meme en este momento.'), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 😂 ${meme.title}`));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(meme.url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
