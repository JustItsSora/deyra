const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

async function fetchCatImage() {
    const res = await fetch('https://cataas.com/cat?json=true');
    if (!res.ok) throw new Error(`cataas ${res.status}`);
    const data = await res.json();
    return `https://cataas.com${data.url}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cat')
        .setDescription('Muestra una imagen aleatoria de un gato'),

    name: 'cat',
    aliases: ['gato'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        let url;
        try {
            url = await fetchCatImage();
        } catch (err) {
            console.error('[cat] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener una imagen de gato en este momento.'), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🐱 Miau'));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
