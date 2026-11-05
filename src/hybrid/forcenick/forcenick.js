const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission, botCanModerate } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('forcenick')
        .setDescription('Fuerza un apodo específico y evita cambios (alias de nickname)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageNicknames)
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
        .addStringOption(o => o.setName('apodo').setDescription('Nuevo apodo').setRequired(true)),

    name: 'forcenick',
    aliases: [],
    category: 'moderación',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageNicknames)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Apodos**.'), ephemeral: true });
        }

        let userId, nick;
        if (isSlash(ctx)) {
            userId = ctx.options.getUser('usuario')?.id;
            nick = ctx.options.getString('apodo');
        } else {
            userId = args[0]?.replace(/[<@!>]/g, '');
            nick = args.slice(1).join(' ');
        }

        const member = userId ? await ctx.guild.members.fetch(userId).catch(() => null) : null;
        if (!member || !nick) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica un usuario y un apodo.'), ephemeral: true });
        }
        if (!botCanModerate(ctx.guild, member)) {
            return reply(ctx, { ...errorPanel('No puedo hacer eso', 'Mi rol no está por encima del de ese usuario.'), ephemeral: true });
        }

        try {
            await member.setNickname(nick, `Forzado por ${executor.user.tag}`);
            return reply(ctx, successPanel('Apodo forzado', `El apodo de ${member.user.tag} ahora es **${nick}**.`));
        } catch (err) {
            console.error('[forcenick] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude cambiar ese apodo.'), ephemeral: true });
        }
    },
};
