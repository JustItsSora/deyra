const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel, buildPanel } = require('../../../lib/panel');
const { Giveaway } = require('../../../data/models');
const { parseDuration, formatDuration } = require('../../../lib/duration');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/giveaway start`.');

        const durationRaw = ctx.options.getString('duracion');
        const prize = ctx.options.getString('premio');
        const winnerCount = ctx.options.getInteger('ganadores') || 1;
        const requiredRole = ctx.options.getRole('rol_requerido');

        const durationMs = parseDuration(durationRaw);
        if (!durationMs) {
            return reply(ctx, { ...errorPanel('Duración inválida', 'Usa un formato como `10m`, `1h`, `2d`.'), ephemeral: true });
        }

        const endsAt = new Date(Date.now() + durationMs);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('giveaway_enter').setLabel('Participar').setStyle(ButtonStyle.Primary).setEmoji('🎉'),
        );

        const panel = buildPanel({
            title: '🎉 ¡Sorteo!',
            description: `**Premio:** ${prize}\n**Termina:** <t:${Math.floor(endsAt.getTime() / 1000)}:R>\n**Ganador(es):** ${winnerCount}${requiredRole ? `\n**Rol requerido:** ${requiredRole}` : ''}\n\nParticipantes: **0**`,
            tone: 'primary',
            rows: [row],
        });

        const sent = await ctx.channel.send({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        if (!sent) {
            return reply(ctx, { ...errorPanel('Error', 'No pude publicar el sorteo.'), ephemeral: true });
        }

        await Giveaway.create({
            guildId: ctx.guild.id,
            channelId: ctx.channel.id,
            messageId: sent.id,
            hostId: ctx.user.id,
            prize,
            winnerCount,
            endsAt,
            requiredRoleId: requiredRole?.id || null,
        });

        return reply(ctx, { ...successPanel('Sorteo iniciado', `El sorteo terminará en **${formatDuration(durationMs)}**.`), ephemeral: true });
    },
};
