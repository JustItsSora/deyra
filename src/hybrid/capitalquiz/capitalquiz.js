const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply } = require('../../lib/reply');
const { buildPanel } = require('../../lib/panel');

const COUNTRIES = [
    { name: 'Francia', capital: 'París' }, { name: 'Japón', capital: 'Tokio' }, { name: 'Brasil', capital: 'Brasilia' },
    { name: 'Canadá', capital: 'Ottawa' }, { name: 'Alemania', capital: 'Berlín' }, { name: 'México', capital: 'Ciudad de México' },
    { name: 'España', capital: 'Madrid' }, { name: 'Italia', capital: 'Roma' }, { name: 'Argentina', capital: 'Buenos Aires' },
    { name: 'Australia', capital: 'Canberra' },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('capitalquiz')
        .setDescription('Adivina la capital de un país'),

    name: 'capitalquiz',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        const correct = COUNTRIES[Math.floor(Math.random() * COUNTRIES.length)];
        const wrongOptions = [...COUNTRIES].filter(c => c.name !== correct.name).sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [...wrongOptions, correct].sort(() => Math.random() - 0.5);

        const row = new ActionRowBuilder().addComponents(
            options.map(o => new ButtonBuilder().setCustomId(`capitalquiz_${o.capital === correct.capital ? 'correct' : 'wrong'}_${o.capital}`).setLabel(o.capital).setStyle(ButtonStyle.Primary)),
        );

        const panel = buildPanel({ title: '🌍 ¿Cuál es la capital de...', description: `**${correct.name}**`, tone: 'primary', rows: [row] });
        return reply(ctx, { components: [panel], flags: MessageFlags.IsComponentsV2 });
    },
};
