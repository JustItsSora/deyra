const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/serversettings systemchannel`.');

        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const channel = ctx.options.getChannel('canal');
        try {
            await ctx.guild.setSystemChannel(channel.id);
            return reply(ctx, successPanel('Canal del sistema actualizado', `Ahora es ${channel}.`));
        } catch (err) {
            console.error('[serversettings systemchannel] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude cambiar el canal del sistema.'), ephemeral: true });
        }
    },
};
