// src/hybrid/sheep/sheep.js
const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { fetchAnimalImage } = require('../../lib/animalApi');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder().setName('sheep').setDescription('Muestra una imagen aleatoria de una oveja'),

    name: 'sheep',
    aliases: ['oveja'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        let url;
        try {
            url = await fetchAnimalImage('sheep');
        } catch (err) {
            console.error('[sheep] Error:', err);
            url = null;
        }

        if (!url) {
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener una imagen de oveja en este momento.'), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🐑 Oveja'));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
