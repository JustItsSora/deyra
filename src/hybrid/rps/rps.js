const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, errorPanel, infoPanel } = require('../../lib/panel');

const OPTIONS = ['piedra', 'papel', 'tijera'];
const BEATS = { piedra: 'tijera', papel: 'piedra', tijera: 'papel' };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rps')
        .setDescription('Juega piedra, papel o tijera contra Deyra')
        .addStringOption(o => o.setName('eleccion').setDescription('Tu elección').setRequired(true)
            .addChoices({ name: 'Piedra', value: 'piedra' }, { name: 'Papel', value: 'papel' }, { name: 'Tijera', value: 'tijera' })),

    name: 'rps',
    aliases: ['ppt'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const choice = isSlash(ctx) ? ctx.options.getString('eleccion') : args[0]?.toLowerCase();
        if (!OPTIONS.includes(choice)) {
            return reply(ctx, { ...errorPanel('Elección inválida', 'Elige entre `piedra`, `papel` o `tijera`.'), ephemeral: true });
        }

        const botChoice = OPTIONS[Math.floor(Math.random() * OPTIONS.length)];

        if (botChoice === choice) {
            return reply(ctx, infoPanel('🤝 Empate', `Ambos elegimos **${choice}**.`));
        }
        if (BEATS[choice] === botChoice) {
            return reply(ctx, successPanel('¡Ganaste!', `Tú: **${choice}** vs Deyra: **${botChoice}**`));
        }
        return reply(ctx, errorPanel('Perdiste', `Tú: **${choice}** vs Deyra: **${botChoice}**`));
    },
};
