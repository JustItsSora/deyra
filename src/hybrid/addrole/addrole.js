const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('addrole')
        .setDescription('Añade un rol a un usuario')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
        .addRoleOption(o => o.setName('rol').setDescription('Rol a añadir').setRequired(true)),

    name: 'addrole',
    aliases: [],
    category: 'moderación',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageRoles)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Roles**.'), ephemeral: true });
        }

        let userId, roleId;
        if (isSlash(ctx)) {
            userId = ctx.options.getUser('usuario')?.id;
            roleId = ctx.options.getRole('rol')?.id;
        } else {
            userId = args[0]?.replace(/[<@!>]/g, '');
            roleId = args[1]?.replace(/[<@&>]/g, '');
        }

        const member = userId ? await ctx.guild.members.fetch(userId).catch(() => null) : null;
        const role = roleId ? ctx.guild.roles.cache.get(roleId) : null;

        if (!member || !role) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica un usuario y un rol válidos.'), ephemeral: true });
        }
        if (ctx.guild.members.me.roles.highest.position <= role.position) {
            return reply(ctx, { ...errorPanel('No puedo hacer eso', 'Ese rol está por encima o al mismo nivel que mi rol más alto.'), ephemeral: true });
        }

        try {
            await member.roles.add(role);
            return reply(ctx, successPanel('Rol añadido', `${role} fue añadido a ${member.user.tag}.`));
        } catch (err) {
            console.error('[addrole] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude añadir ese rol.'), ephemeral: true });
        }
    },
};
