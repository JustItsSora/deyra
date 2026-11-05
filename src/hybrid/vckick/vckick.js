const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vckick')
        .setDescription('Expulsa a un usuario de su canal de voz actual')
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)),

    name: 'vckick',
    aliases: [],
    category: 'moderación',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.MoveMembers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Mover Miembros**.'), ephemeral: true });
        }

        const userId = isSlash(ctx) ? ctx.options.getUser('usuario')?.id : args[0]?.replace(/[<@!>]/g, '');
        const member = userId ? await ctx.guild.members.fetch(userId).catch(() => null) : null;

        if (!member || !member.voice.channel) {
            return reply(ctx, { ...errorPanel('No disponible', 'Ese usuario no está en un canal de voz.'), ephemeral: true });
        }

        try {
            await member.voice.disconnect(`Expulsado por ${executor.user.tag}`);
            return reply(ctx, successPanel('Expulsado de voz', `${member.user.tag} fue expulsado de su canal de voz.`));
        } catch (err) {
            console.error('[vckick] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude expulsar a ese usuario del canal de voz.'), ephemeral: true });
        }
    },
};
