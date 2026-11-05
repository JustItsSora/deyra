const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { logModAction } = require('../../../lib/modLog');
const { emoji } = require('../../../lib/emojis');

module.exports = {
    async execute(ctx, args) {
        const guild = ctx.guild;
        const executorId = getUserId(ctx);
        const executor = guild.members.cache.get(executorId) || await guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.BanMembers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Banear Miembros**.'), ephemeral: true });
        }

        const id = isSlash(ctx) ? ctx.options.getString('id') : args[0]?.replace(/[<@!>]/g, '');
        const reason = isSlash(ctx) ? (ctx.options.getString('razon') || 'Sin razón especificada') : (args.slice(1).join(' ') || 'Sin razón especificada');

        if (!id || !/^\d{17,20}$/.test(id)) {
            return reply(ctx, { ...errorPanel('ID inválido', 'Proporciona un ID de usuario válido.'), ephemeral: true });
        }

        try {
            const bans = await guild.bans.fetch();
            if (!bans.has(id)) {
                return reply(ctx, { ...errorPanel('No está baneado', 'Ese usuario no está en la lista de baneados.'), ephemeral: true });
            }

            await guild.members.unban(id, `${reason} | Moderador: ${executor.user.tag}`);

            await logModAction(guild, {
                title: `${emoji('YES')} Usuario desbaneado`,
                description: `**ID:** ${id}\n**Moderador:** ${executor.user.tag}\n**Razón:** ${reason}`,
                tone: 'success',
            });

            return reply(ctx, successPanel('Usuario desbaneado', `El usuario con ID \`${id}\` ha sido desbaneado.`));
        } catch (err) {
            console.error('[mod unban] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude desbanear a ese usuario.'), ephemeral: true });
        }
    },
};
