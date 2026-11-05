const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

async function fetchFoxImage() {
    const res = await fetch('https://randomfox.ca/floof/');
    if (!res.ok) throw new Error(`randomfox ${res.status}`);
    const data = await res.json();
    if (!data.image) throw new Error('Sin imagen en la respuesta');
    return data.image;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('fox')
        .setDescription('Muestra una imagen aleatoria de un zorro'),

    name: 'fox',
    aliases: ['zorro'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        let url;
        try {
            url = await fetchFoxImage();
        } catch (err) {
            console.error('[fox] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener una imagen de zorro en este momento.'), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🦊 Zorro'));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
