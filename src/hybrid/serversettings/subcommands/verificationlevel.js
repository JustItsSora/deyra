const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/serversettings verificationlevel`.');

        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const level = ctx.options.getString('nivel');
        try {
            await ctx.guild.setVerificationLevel(level);
            return reply(ctx, successPanel('Nivel de verificación actualizado', `Ahora es: **${level}**.`));
        } catch (err) {
            console.error('[serversettings verificationlevel] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude cambiar el nivel de verificación.'), ephemeral: true });
        }
    },
};
