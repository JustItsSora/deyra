const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hidechannel')
        .setDescription('Oculta este canal de @everyone')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    name: 'hidechannel',
    aliases: [],
    category: 'moderación',
    cooldownMs: 2000,

    async execute(ctx) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageChannels)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Canales**.'), ephemeral: true });
        }

        try {
            await ctx.channel.permissionOverwrites.edit(ctx.guild.roles.everyone, { ViewChannel: false });
            return reply(ctx, successPanel('Canal oculto', 'Este canal ahora está oculto para @everyone.'));
        } catch (err) {
            console.error('[hidechannel] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude ocultar este canal.'), ephemeral: true });
        }
    },
};
