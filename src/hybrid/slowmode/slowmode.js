const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Configura el modo lento de este canal')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addIntegerOption(o => o.setName('segundos').setDescription('Segundos entre mensajes (0 para desactivar, máx 21600)').setMinValue(0).setMaxValue(21600).setRequired(true)),

    name: 'slowmode',
    aliases: ['sm'],
    category: 'moderación',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageChannels)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Canales**.'), ephemeral: true });
        }

        const seconds = isSlash(ctx) ? ctx.options.getInteger('segundos') : parseInt(args[0], 10);
        if (Number.isNaN(seconds) || seconds < 0 || seconds > 21600) {
            return reply(ctx, { ...errorPanel('Valor inválido', 'Especifica entre 0 y 21600 segundos.'), ephemeral: true });
        }

        try {
            await ctx.channel.setRateLimitPerUser(seconds);
            return reply(ctx, successPanel('Modo lento actualizado', seconds === 0 ? 'El modo lento fue desactivado.' : `Modo lento configurado a **${seconds}s**.`));
        } catch (err) {
            console.error('[slowmode] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude cambiar el modo lento de este canal.'), ephemeral: true });
        }
    },
};
