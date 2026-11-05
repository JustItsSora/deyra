const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('auditlog')
        .setDescription('Muestra las últimas 10 entradas del registro de auditoría')
        .setDefaultMemberPermissions(PermissionFlagsBits.ViewAuditLog),

    name: 'auditlog',
    aliases: ['registrodeauditoria'],
    category: 'moderación',
    cooldownMs: 3000,

    async execute(ctx) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ViewAuditLog)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Ver Registro de Auditoría**.'), ephemeral: true });
        }

        const logs = await ctx.guild.fetchAuditLogs({ limit: 10 }).catch(() => null);
        if (!logs || logs.entries.size === 0) {
            return reply(ctx, infoPanel('Registro de auditoría', 'No hay entradas recientes.'));
        }

        const lines = [...logs.entries.values()].map(e => `**${e.actionType}** por ${e.executor?.tag || 'Desconocido'} — <t:${Math.floor(e.createdTimestamp / 1000)}:R>`);
        return reply(ctx, infoPanel('📜 Registro de auditoría reciente', undefined, { lines }));
    },
};
