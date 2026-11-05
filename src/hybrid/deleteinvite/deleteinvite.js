const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deleteinvite')
        .setDescription('Elimina una invitación por su código')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(o => o.setName('codigo').setDescription('Código de la invitación').setRequired(true)),

    name: 'deleteinvite',
    aliases: ['borrarinvite'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const code = isSlash(ctx) ? ctx.options.getString('codigo') : args[0];
        if (!code) {
            return reply(ctx, { ...errorPanel('Falta el código', 'Especifica el código de la invitación.'), ephemeral: true });
        }

        try {
            const invites = await ctx.guild.invites.fetch();
            const invite = invites.get(code);
            if (!invite) {
                return reply(ctx, { ...errorPanel('No encontrada', 'No existe una invitación con ese código.'), ephemeral: true });
            }
            await invite.delete();
            return reply(ctx, successPanel('Invitación eliminada', `Se eliminó la invitación \`${code}\`.`));
        } catch (err) {
            console.error('[deleteinvite] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude eliminar esa invitación.'), ephemeral: true });
        }
    },
};
