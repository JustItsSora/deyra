const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx, args) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageMessages)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Mensajes**.'), ephemeral: true });
        }

        const messageId = isSlash(ctx) ? ctx.options.getString('message_id') : args[0];
        const message = messageId ? await ctx.channel.messages.fetch(messageId).catch(() => null) : null;

        if (!message) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No pude encontrar un mensaje con ese ID en este canal.'), ephemeral: true });
        }

        try {
            await message.unpin();
            return reply(ctx, successPanel('Mensaje desfijado', 'El mensaje fue desfijado de este canal.'));
        } catch (err) {
            console.error('[mod unpinmsg] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude desfijar ese mensaje.'), ephemeral: true });
        }
    },
};
