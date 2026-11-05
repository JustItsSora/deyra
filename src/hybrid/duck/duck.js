const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

async function fetchDuckImage() {
    const res = await fetch('https://random-d.uk/api/random');
    if (!res.ok) throw new Error(`random-d.uk ${res.status}`);
    const data = await res.json();
    if (!data.url) throw new Error('Sin imagen en la respuesta');
    return data.url;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('duck')
        .setDescription('Muestra una imagen aleatoria de un pato'),

    name: 'duck',
    aliases: ['pato'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        let url;
        try {
            url = await fetchDuckImage();
        } catch (err) {
            console.error('[duck] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener una imagen de pato en este momento.'), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🦆 Cuac'));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
