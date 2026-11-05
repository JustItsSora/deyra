const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('webhooklist')
        .setDescription('Lista los webhooks de este canal')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageWebhooks),

    name: 'webhooklist',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageWebhooks)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Webhooks**.'), ephemeral: true });
        }

        const webhooks = await ctx.channel.fetchWebhooks().catch(() => null);
        if (!webhooks || webhooks.size === 0) {
            return reply(ctx, infoPanel('Webhooks', 'Este canal no tiene webhooks.'));
        }

        const lines = [...webhooks.values()].map(w => `**${w.name}** (${w.id})`);
        return reply(ctx, infoPanel(`Webhooks de #${ctx.channel.name}`, undefined, { lines }));
    },
};
