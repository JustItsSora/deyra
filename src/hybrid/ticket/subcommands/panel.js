const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { errorPanel, buildPanel } = require('../../../lib/panel');
const { TicketConfig } = require('../../../data/models');
const { emoji } = require('../../../lib/emojis');

module.exports = {
    async execute(ctx, args) {
        const guild = ctx.guild;
        const executorId = getUserId(ctx);
        const executor = guild.members.cache.get(executorId) || await guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        if (!isSlash(ctx)) {
            return reply(ctx, 'Este comando solo está disponible como slash command: `/ticket panel`.');
        }

        const config = await TicketConfig.findOne({ where: { guildId: guild.id } });
        if (!config?.categoryId) {
            return reply(ctx, { ...errorPanel('No configurado', 'Primero corre `/ticket setup` para configurar el sistema.'), ephemeral: true });
        }

        const channel = ctx.options.getChannel('canal');
        const title = ctx.options.getString('titulo') || config.panelTitle || 'Soporte';
        const description = ctx.options.getString('descripcion') || config.panelDescription || 'Haz clic en el botón de abajo para abrir un ticket.';

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('ticket_create').setLabel('Abrir Ticket').setStyle(ButtonStyle.Primary).setEmoji('🎫'),
        );

        const panel = buildPanel({ title: `${emoji('SUPPORT')} ${title}`, description, tone: 'primary', rows: [row] });

        try {
            const sent = await channel.send({ components: [panel], flags: MessageFlags.IsComponentsV2 });
            config.panelChannelId = channel.id;
            config.panelMessageId = sent.id;
            config.panelTitle = title;
            config.panelDescription = description;
            await config.save();

            return reply(ctx, { content: `Panel publicado en ${channel}.`, ephemeral: true });
        } catch (err) {
            console.error('[ticket panel] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude enviar el panel a ese canal. Revisa mis permisos.'), ephemeral: true });
        }
    },
};
