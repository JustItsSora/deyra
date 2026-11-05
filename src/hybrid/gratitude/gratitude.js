const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('gratitude')
        .setDescription('Comparte algo por lo que estás agradecido/a')
        .addStringOption(o => o.setName('texto').setDescription('Por lo que estás agradecido/a').setRequired(true)),

    name: 'gratitude',
    aliases: ['gratitud'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Comparte algo por lo que estás agradecido/a.'), ephemeral: true });
        }

        return reply(ctx, infoPanel('🙏 Gratitud', `Hoy estoy agradecido/a por: **${text}**`));
    },
};
