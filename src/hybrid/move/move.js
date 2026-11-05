// src/hybrid/move/move.js
// Mueve al bot a tu canal de voz actual.
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, getMember } = require('../../lib/reply');
const { successPanel, warningPanel, errorPanel } = require('../../lib/panel');
const { requireMusic, requireVoiceChannel, isNoNodeError, noNodePanel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder().setName('move').setDescription('Mueve al bot a tu canal de voz actual'),

    name: 'move',
    aliases: ['moveme', 'followme'],
    category: 'música',
    cooldownMs: 3000,

    async execute(ctx) {
        const client = ctx.client;
        if (!requireMusic(ctx)) return;
        if (!requireVoiceChannel(ctx)) return;

        const member = getMember(ctx);
        const { channel } = member.voice;
        const guild = channel.guild;
        const textChannelId = ctx.channelId || ctx.channel?.id;
        const player = client.music.players.get(guild.id);

        if (!player) {
            if (!guild.members.me.permissions.has(PermissionsBitField.resolve(['Speak', 'Connect']))) {
                return reply(ctx, { ...warningPanel('Permisos insuficientes', 'Necesito los permisos `Conectar` y `Hablar`.'), ephemeral: true });
            }

            try {
                await client.music.createPlayer({
                    guildId: guild.id,
                    voiceId: channel.id,
                    textId: textChannelId,
                    volume: 80,
                    deaf: true,
                });
                return reply(ctx, successPanel('Conectado', `Me uní a <#${channel.id}> y quedé asociado a <#${textChannelId}>.`));
            } catch (err) {
                if (isNoNodeError(err)) {
                    console.error('[move] Sin nodo de Lavalink:', err.message);
                    return reply(ctx, { ...noNodePanel(client.music), ephemeral: true });
                }
                return reply(ctx, { ...errorPanel('No pude unirme', err.message), ephemeral: true });
            }
        }

        if (player.voiceId === channel.id) {
            return reply(ctx, { ...warningPanel('Ya estoy ahí', 'Ya estoy en tu canal de voz.'), ephemeral: true });
        }

        try {
            player.setVoiceChannel(channel.id);
            return reply(ctx, successPanel('Movido', `Me moví a <#${channel.id}>.`));
        } catch (err) {
            return reply(ctx, { ...errorPanel('Error al mover', err.message), ephemeral: true });
        }
    },
};
