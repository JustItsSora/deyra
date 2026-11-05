const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField, MessageFlags } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { errorPanel, buildPanel } = require('../../lib/panel');
const { emoji } = require('../../lib/emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nuke')
        .setDescription('Clona este canal para borrar todo su historial de mensajes')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    name: 'nuke',
    aliases: [],
    category: 'moderación',
    cooldownMs: 5000,

    async execute(ctx) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageChannels)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Canales**.'), ephemeral: true });
        }

        const channel = ctx.channel;
        try {
            const clone = await channel.clone();
            await clone.setPosition(channel.position);
            await channel.delete();

            const panel = buildPanel({ title: `${emoji('BAN')} Canal reiniciado`, description: `Este canal fue reiniciado por ${executor.user.tag}.`, tone: 'warning' });
            await clone.send({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        } catch (err) {
            console.error('[nuke] Error:', err);
        }
    },
};
