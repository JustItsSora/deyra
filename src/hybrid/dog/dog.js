const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

async function fetchDogImage() {
    const res = await fetch('https://dog.ceo/api/breeds/image/random');
    if (!res.ok) throw new Error(`dog.ceo ${res.status}`);
    const data = await res.json();
    if (!data.message) throw new Error('Sin imagen en la respuesta');
    return data.message;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dog')
        .setDescription('Muestra una imagen aleatoria de un perro'),

    name: 'dog',
    aliases: ['perro'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        let url;
        try {
            url = await fetchDogImage();
        } catch (err) {
            console.error('[dog] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener una imagen de perro en este momento.'), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🐶 Guau'));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
