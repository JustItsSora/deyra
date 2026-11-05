const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');
const { Economy } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economyreset')
        .setDescription('[Admin] Reinicia el saldo económico de un usuario')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)),

    name: 'economyreset',
    aliases: [],
    category: 'economía',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const userId = isSlash(ctx) ? ctx.options.getUser('usuario')?.id : args[0]?.replace(/[<@!>]/g, '');
        const record = await Economy.findOne({ where: { guildId: ctx.guild.id, userId } });

        if (!record) {
            return reply(ctx, { ...errorPanel('Sin datos', 'Ese usuario no tiene actividad económica registrada.'), ephemeral: true });
        }

        record.wallet = 0;
        record.bank = 0;
        record.inventory = '[]';
        await record.save();

        return reply(ctx, successPanel('Economía reiniciada', `Se reinició el saldo e inventario de <@${userId}>.`));
    },
};
