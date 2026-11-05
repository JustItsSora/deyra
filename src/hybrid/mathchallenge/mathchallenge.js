const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply } = require('../../lib/reply');
const { buildPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mathchallenge')
        .setDescription('Resuelve una operación con 4 opciones de respuesta, contra el reloj'),

    name: 'mathchallenge',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        const correct = a + b;

        const wrongs = new Set();
        while (wrongs.size < 3) {
            const delta = Math.floor(Math.random() * 10) - 5;
            const candidate = correct + delta;
            if (candidate !== correct && candidate > 0) wrongs.add(candidate);
        }

        const options = [...wrongs, correct].sort(() => Math.random() - 0.5);
        const row = new ActionRowBuilder().addComponents(
            options.map(o => new ButtonBuilder().setCustomId(`mathchallenge_${o === correct ? 'correct' : 'wrong'}_${o}`).setLabel(String(o)).setStyle(ButtonStyle.Primary)),
        );

        const panel = buildPanel({ title: '⚡ Reto matemático', description: `**${a} + ${b} = ?**`, tone: 'primary', rows: [row] });
        return reply(ctx, { components: [panel], flags: MessageFlags.IsComponentsV2 });
    },
};
