const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { buildPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('marry')
        .setDescription('Propón matrimonio a alguien (de broma)')
        .addUserOption(o => o.setName('usuario').setDescription('Tu pareja').setRequired(true)),

    name: 'marry',
    aliases: ['casar'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const authorId = getUserId(ctx);
        const targetId = isSlash(ctx) ? ctx.options.getUser('usuario')?.id : args[0]?.replace(/[<@!>]/g, '');

        if (!targetId) {
            return reply(ctx, { ...errorPanel('Falta el usuario', 'Menciona a quién quieres proponerle matrimonio.'), ephemeral: true });
        }
        if (targetId === authorId) {
            return reply(ctx, { ...errorPanel('No puedes hacer eso', 'No puedes casarte contigo mismo.'), ephemeral: true });
        }

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`marry_accept_${authorId}_${targetId}`).setLabel('Acepto 💍').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`marry_reject_${authorId}_${targetId}`).setLabel('Rechazar').setStyle(ButtonStyle.Danger),
        );

        const panel = buildPanel({
            title: '💍 ¡Propuesta de matrimonio!',
            description: `<@${authorId}> le propone matrimonio a <@${targetId}>. ¿Qué dices?`,
            tone: 'primary',
            rows: [row],
        });

        return reply(ctx, { components: [panel], flags: MessageFlags.IsComponentsV2 });
    },
};
