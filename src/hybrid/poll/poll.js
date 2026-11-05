const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { buildPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Crea una encuesta rápida de Sí/No')
        .addStringOption(o => o.setName('pregunta').setDescription('La pregunta de la encuesta').setRequired(true)),

    name: 'poll',
    aliases: ['encuesta'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const question = isSlash(ctx) ? ctx.options.getString('pregunta') : args.join(' ');
        if (!question) {
            return reply(ctx, { ...errorPanel('Falta la pregunta', 'Especifica la pregunta de la encuesta.'), ephemeral: true });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('poll_yes').setLabel('Sí').setStyle(ButtonStyle.Success).setEmoji('✅'),
            new ButtonBuilder().setCustomId('poll_no').setLabel('No').setStyle(ButtonStyle.Danger).setEmoji('❌'),
        );

        const panel = buildPanel({ title: '📊 Encuesta', description: question, tone: 'primary', rows: [row] });
        return reply(ctx, { components: [panel], flags: MessageFlags.IsComponentsV2 });
    },
};
