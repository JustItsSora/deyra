const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission, botCanModerate } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx, args) {
        const guild = ctx.guild;
        const executorId = getUserId(ctx);
        const executor = guild.members.cache.get(executorId) || await guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ManageNicknames)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Apodos**.'), ephemeral: true });
        }

        let userId, newNick;
        if (isSlash(ctx)) {
            userId = ctx.options.getUser('usuario')?.id;
            newNick = ctx.options.getString('nuevo_nombre') || null;
        } else {
            userId = args[0]?.replace(/[<@!>]/g, '');
            newNick = args.slice(1).join(' ') || null;
        }

        const member = userId ? await guild.members.fetch(userId).catch(() => null) : null;
        if (!member) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario en el servidor.'), ephemeral: true });
        }

        if (!botCanModerate(guild, member)) {
            return reply(ctx, { ...errorPanel('No puedo hacer eso', 'Mi rol no está por encima del de ese usuario.'), ephemeral: true });
        }

        try {
            await member.setNickname(newNick, `Cambiado por ${executor.user.tag}`);
            return reply(ctx, successPanel('Apodo actualizado', newNick ? `El apodo de ${member.user.tag} ahora es **${newNick}**.` : `Se removió el apodo de ${member.user.tag}.`));
        } catch (err) {
            console.error('[mod nickname] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude cambiar el apodo de ese usuario.'), ephemeral: true });
        }
    },
};
