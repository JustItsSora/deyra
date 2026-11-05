const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelpermissions')
        .setDescription('Muestra los overwrites de permisos configurados en este canal')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),

    name: 'channelpermissions',
    aliases: ['permisoscanal'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageChannels)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Canales**.'), ephemeral: true });
        }

        const overwrites = ctx.channel.permissionOverwrites.cache;
        if (overwrites.size === 0) {
            return reply(ctx, infoPanel('Permisos del canal', 'Este canal no tiene overwrites de permisos personalizados.'));
        }

        const lines = [...overwrites.values()].map(o => {
            const target = o.type === 0 ? `<@&${o.id}>` : `<@${o.id}>`;
            const allowed = o.allow.toArray().length;
            const denied = o.deny.toArray().length;
            return `${target} — ${allowed} permitido(s), ${denied} denegado(s)`;
        });

        return reply(ctx, infoPanel('Overwrites de permisos', undefined, { lines }));
    },
};
