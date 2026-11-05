const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createinvite')
        .setDescription('Crea una invitación para este canal')
        .setDefaultMemberPermissions(PermissionFlagsBits.CreateInstantInvite)
        .addIntegerOption(o => o.setName('duracion_horas').setDescription('Duración en horas (0 = permanente)').setMinValue(0).setMaxValue(168).setRequired(false))
        .addIntegerOption(o => o.setName('usos_maximos').setDescription('Usos máximos (0 = ilimitado)').setMinValue(0).setMaxValue(100).setRequired(false)),

    name: 'createinvite',
    aliases: ['crearinvite'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.CreateInstantInvite)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Crear Invitación**.'), ephemeral: true });
        }

        const hours = isSlash(ctx) ? (ctx.options.getInteger('duracion_horas') ?? 24) : 24;
        const maxUses = isSlash(ctx) ? (ctx.options.getInteger('usos_maximos') ?? 0) : 0;

        try {
            const invite = await ctx.channel.createInvite({ maxAge: hours * 3600, maxUses });
            return reply(ctx, successPanel('Invitación creada', `https://discord.gg/${invite.code}`));
        } catch (err) {
            console.error('[createinvite] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude crear una invitación para este canal.'), ephemeral: true });
        }
    },
};
