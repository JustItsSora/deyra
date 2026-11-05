const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');
const { Blacklist } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unblacklist')
        .setDescription('[Owner] Desbloquea a un usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a desbloquear').setRequired(true)),

    name: 'unblacklist',
    aliases: [],
    category: 'owner',

    async execute(ctx, args = []) {
        if (!isOwner(getUserId(ctx))) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Este comando es solo para el dueño del bot.'), ephemeral: true });
        }

        const userId = isSlash(ctx) ? ctx.options.getUser('usuario')?.id : args[0]?.replace(/[<@!>]/g, '');
        const deleted = await Blacklist.destroy({ where: { userId } });

        if (!deleted) {
            return reply(ctx, { ...errorPanel('No encontrado', 'Ese usuario no está en la blacklist.'), ephemeral: true });
        }

        return reply(ctx, successPanel('Usuario desbloqueado', `<@${userId}> fue removido de la blacklist.`));
    },
};
