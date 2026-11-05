const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invitelist')
        .setDescription('Lista las invitaciones activas del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild),

    name: 'invitelist',
    aliases: ['invitaciones'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        const invites = await ctx.guild.invites.fetch().catch(() => null);
        if (!invites || invites.size === 0) {
            return reply(ctx, infoPanel('Invitaciones', 'No hay invitaciones activas.'));
        }

        const lines = [...invites.values()].slice(0, 20).map(i => `**${i.code}** — ${i.uses || 0} uso(s) — creado por ${i.inviter?.tag || 'Desconocido'}`);
        return reply(ctx, infoPanel(`Invitaciones activas (${invites.size})`, undefined, { lines }));
    },
};
