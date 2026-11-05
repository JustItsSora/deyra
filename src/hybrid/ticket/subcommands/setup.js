const { PermissionsBitField, ChannelType } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { TicketConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        const guild = ctx.guild;
        const executorId = getUserId(ctx);
        const executor = guild.members.cache.get(executorId) || await guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        if (!isSlash(ctx)) {
            return reply(ctx, 'Este comando de configuración solo está disponible como slash command: `/ticket setup`.');
        }

        const category = ctx.options.getChannel('categoria');
        const supportRole = ctx.options.getRole('rol_soporte');
        const logChannel = ctx.options.getChannel('canal_logs');

        if (category.type !== ChannelType.GuildCategory) {
            return reply(ctx, { ...errorPanel('Canal inválido', 'Debes seleccionar una **categoría**, no un canal de texto.'), ephemeral: true });
        }

        const [config] = await TicketConfig.findOrCreate({ where: { guildId: guild.id }, defaults: { guildId: guild.id } });
        config.categoryId = category.id;
        config.supportRoleIds = JSON.stringify([supportRole.id]);
        if (logChannel) config.logChannelId = logChannel.id;
        await config.save();

        return reply(ctx, successPanel(
            'Sistema de tickets configurado',
            `**Categoría:** ${category}\n**Rol de soporte:** ${supportRole}\n**Canal de logs:** ${logChannel || 'No configurado'}\n\nAhora usa \`/ticket panel\` para publicar el botón de creación de tickets.`,
        ));
    },
};
