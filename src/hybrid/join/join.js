// src/hybrid/join/join.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getMember } = require('../../lib/reply');
const { successPanel, warningPanel, errorPanel } = require('../../lib/panel');
const { requireMusic, requireVoiceChannel, isNoNodeError, noNodePanel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder().setName('join').setDescription('El bot se une a tu canal de voz actual'),

    name: 'join',
    aliases: ['j'],
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

        const existingPlayer = client.music.players.get(guild.id);
        if (existingPlayer) {
            return reply(ctx, { ...warningPanel('Ya conectado', `Ya estoy conectado en <#${existingPlayer.voiceId}>.`), ephemeral: true });
        }

        if (!guild.members.me.permissions.has(PermissionsBitField.resolve(['Speak', 'Connect']))) {
            return reply(ctx, { ...warningPanel('Permisos insuficientes', 'Necesito los permisos `Conectar` y `Hablar` para unirme a tu canal de voz.'), ephemeral: true });
        }

        try {
            await client.music.createPlayer({
                guildId: guild.id,
                voiceId: channel.id,
                textId: textChannelId,
                volume: 80,
                deaf: true,
                mute: false,
            });
        } catch (err) {
            // Antes esto no tenía catch: el error subía al handler global y el
            // usuario veía "Ocurrió un error ejecutando este comando", que no
            // dice nada. Ahora dice qué pasó.
            if (isNoNodeError(err)) {
                console.error('[join] Sin nodo de Lavalink:', err.message);
                return reply(ctx, { ...noNodePanel(client.music), ephemeral: true });
            }
            console.error('[join] No pude crear el reproductor:', err);
            return reply(ctx, { ...errorPanel('No pude unirme', `No pude conectarme al canal de voz: ${err.message}`), ephemeral: true });
        }

        return reply(ctx, successPanel('Conectado', `Me uní a <#${channel.id}> y quedé asociado a <#${textChannelId}>.`));
    },
};
