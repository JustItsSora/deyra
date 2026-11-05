const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

// NASA APOD — usa DEMO_KEY pública de NASA (30 solicitudes/hora), sin necesidad de registro propio.
async function fetchApod() {
    const res = await fetch('https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY');
    if (!res.ok) throw new Error(`nasa apod ${res.status}`);
    return res.json();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nasa')
        .setDescription('Muestra la foto astronómica del día de la NASA'),

    name: 'nasa',
    aliases: ['apod'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        let data;
        try {
            data = await fetchApod();
        } catch (err) {
            console.error('[nasa] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener la foto astronómica del día.'), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🔭 ${data.title}\n${(data.explanation || '').slice(0, 300)}...`));
        if (data.media_type === 'image') {
            container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(data.url)));
        }

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
