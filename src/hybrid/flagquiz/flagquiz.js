const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

const COUNTRIES = [
    { name: 'Francia', code: 'fr' }, { name: 'Japón', code: 'jp' }, { name: 'Brasil', code: 'br' },
    { name: 'Canadá', code: 'ca' }, { name: 'Alemania', code: 'de' }, { name: 'México', code: 'mx' },
    { name: 'España', code: 'es' }, { name: 'Italia', code: 'it' }, { name: 'Argentina', code: 'ar' },
    { name: 'Corea del Sur', code: 'kr' },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('flagquiz')
        .setDescription('Adivina el país de la bandera mostrada'),

    name: 'flagquiz',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        const correct = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
        const wrongOptions = [...COUNTRIES].filter(c => c.code !== correct.code).sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [...wrongOptions, correct].sort(() => Math.random() - 0.5);

        const flagUrl = `https://flagcdn.com/w320/${correct.code}.png`;

        const row = new ActionRowBuilder().addComponents(
            options.map(o => new ButtonBuilder().setCustomId(`flagquiz_${o.code === correct.code ? 'correct' : 'wrong'}_${o.name}`).setLabel(o.name).setStyle(ButtonStyle.Primary)),
        );

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🏳️ ¿De qué país es esta bandera?'));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(flagUrl)));
        container.addActionRowComponents(row);

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
