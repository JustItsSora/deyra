const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { reply } = require('../../lib/reply');
const config = require('../../config');

const COLOR_NAMES = ['Rojo', 'Verde', 'Azul', 'Amarillo', 'Morado', 'Naranja', 'Rosa', 'Cian'];
const COLOR_HEX = { Rojo: 0xE74C3C, Verde: 0x2ECC71, Azul: 0x3498DB, Amarillo: 0xF1C40F, Morado: 0x9B59B6, Naranja: 0xE67E22, Rosa: 0xFF69B4, Cian: 0x1ABC9C };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guessthecolor')
        .setDescription('Adivina el nombre del color mostrado'),

    name: 'guessthecolor',
    aliases: ['adivinacolor'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        const correct = COLOR_NAMES[Math.floor(Math.random() * COLOR_NAMES.length)];
        const wrongs = COLOR_NAMES.filter(c => c !== correct).sort(() => Math.random() - 0.5).slice(0, 3);
        const options = [...wrongs, correct].sort(() => Math.random() - 0.5);

        const row = new ActionRowBuilder().addComponents(
            options.map(o => new ButtonBuilder().setCustomId(`guessthecolor_${o === correct ? 'correct' : 'wrong'}_${o}`).setLabel(o).setStyle(ButtonStyle.Secondary)),
        );

        const container = new ContainerBuilder().setAccentColor(COLOR_HEX[correct]);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent('## 🎨 ¿Qué color es este?'));
        container.addActionRowComponents(row);

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
