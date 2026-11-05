// src/hybrid/possum/possum.js
const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { fetchAnimalImage } = require('../../lib/animalApi');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder().setName('possum').setDescription('Muestra una imagen aleatoria de una zarigüeya'),

    name: 'possum',
    aliases: ['zarigueya', 'zarigüeya'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        let url;
        try {
            url = await fetchAnimalImage('possum');
        } catch (err) {
            console.error('[possum] Error:', err);
            url = null;
        }

        if (!url) {
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener una imagen de zarigüeya en este momento.'), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🦝 Zarigüeya'));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
