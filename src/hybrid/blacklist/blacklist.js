const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');
const { Blacklist } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklist')
        .setDescription('[Owner] Bloquea a un usuario de usar el bot')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a bloquear').setRequired(true))
        .addStringOption(o => o.setName('razon').setDescription('Razón').setRequired(false)),

    name: 'blacklist',
    aliases: [],
    category: 'owner',

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        if (!isOwner(executorId)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Este comando es solo para el dueño del bot.'), ephemeral: true });
        }

        let userId, reason;
        if (isSlash(ctx)) {
            userId = ctx.options.getUser('usuario')?.id;
            reason = ctx.options.getString('razon') || 'Sin razón especificada';
        } else {
            userId = args[0]?.replace(/[<@!>]/g, '');
            reason = args.slice(1).join(' ') || 'Sin razón especificada';
        }

        if (!userId) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'Especifica un usuario.'), ephemeral: true });
        }
        if (isOwner(userId)) {
            return reply(ctx, { ...errorPanel('No puedes hacer eso', 'No puedes bloquear al dueño del bot.'), ephemeral: true });
        }

        const [entry, created] = await Blacklist.findOrCreate({
            where: { userId },
            defaults: { userId, reason, addedBy: executorId },
        });

        if (!created) {
            return reply(ctx, { ...errorPanel('Ya bloqueado', 'Ese usuario ya está en la blacklist.'), ephemeral: true });
        }

        return reply(ctx, successPanel('Usuario bloqueado', `<@${userId}> fue añadido a la blacklist.\n**Razón:** ${reason}`));
    },
};
