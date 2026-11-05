const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vcmove')
        .setDescription('Mueve a un usuario a otro canal de voz')
        .setDefaultMemberPermissions(PermissionFlagsBits.MoveMembers)
        .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
        .addChannelOption(o => o.setName('canal').setDescription('Canal de voz destino').setRequired(true)),

    name: 'vcmove',
    aliases: [],
    category: 'moderación',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.MoveMembers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Mover Miembros**.'), ephemeral: true });
        }

        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/vcmove`.');

        const member = await ctx.guild.members.fetch(ctx.options.getUser('usuario').id).catch(() => null);
        const channel = ctx.options.getChannel('canal');

        if (!member || !member.voice.channel) {
            return reply(ctx, { ...errorPanel('No disponible', 'Ese usuario no está en un canal de voz.'), ephemeral: true });
        }

        try {
            await member.voice.setChannel(channel, `Movido por ${executor.user.tag}`);
            return reply(ctx, successPanel('Usuario movido', `${member.user.tag} fue movido a ${channel}.`));
        } catch (err) {
            console.error('[vcmove] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude mover a ese usuario.'), ephemeral: true });
        }
    },
};
