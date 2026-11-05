const { PermissionsBitField } = require('discord.js');
const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { Ticket } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        const ticket = await Ticket.findOne({ where: { channelId: ctx.channel.id } });
        if (!ticket) {
            return reply(ctx, { ...errorPanel('No es un ticket', 'Este comando solo funciona dentro de un canal de ticket.'), ephemeral: true });
        }

        const userId = isSlash(ctx) ? ctx.options.getUser('usuario')?.id : args[0]?.replace(/[<@!>]/g, '');
        if (!userId) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'Especifica un usuario.'), ephemeral: true });
        }

        try {
            await ctx.channel.permissionOverwrites.edit(userId, {
                ViewChannel: true, SendMessages: true, ReadMessageHistory: true,
            });
            return reply(ctx, successPanel('Usuario añadido', `<@${userId}> ahora puede ver este ticket.`));
        } catch (err) {
            console.error('[ticket add] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude añadir a ese usuario.'), ephemeral: true });
        }
    },
};
