// src/hybrid/mood/mood.js
const {
    ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, StringSelectMenuBuilder,
    MessageFlags, PermissionsBitField, SlashCommandBuilder,
} = require('discord.js');
const { isSlash, getMember, replyAndGetMessage } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { requireMusic, requireVoiceChannel, isNoNodeError, noNodePanel } = require('../../music/lib/musicChecks');
const config = require('../../config');

const moods = [
    { label: 'Relax', value: 'chill lofi relax', description: 'Vibras tranquilas y relajadas' },
    { label: 'Energía', value: 'hype workout energetic', description: 'Canciones de alta energía' },
    { label: 'Triste', value: 'sad emotional ballad', description: 'Canciones emotivas y melancólicas' },
    { label: 'Fiesta', value: 'party dance edm', description: 'Himnos de baile y fiesta' },
    { label: 'Concentración', value: 'focus instrumental study', description: 'Música instrumental para enfocarte' },
    { label: 'Romántico', value: 'romantic love songs', description: 'Canciones de amor' },
    { label: 'Hip-Hop', value: 'hip hop rap hits', description: 'Lo mejor del hip-hop y rap' },
    { label: 'Rock', value: 'rock hits classic', description: 'Himnos del rock' },
    { label: 'K-Pop', value: 'k-pop hits', description: 'Lo mejor del pop coreano' },
    { label: 'Latino', value: 'latin reggaeton hits', description: 'Ritmos latinos' },
];

function statusContainer(text) {
    return new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
}

module.exports = {
    data: new SlashCommandBuilder().setName('mood').setDescription('Reproduce una mezcla de música según un estado de ánimo o género'),

    name: 'mood',
    aliases: ['genre', 'vibe'],
    category: 'música',
    cooldownMs: 5000,

    async execute(ctx) {
        const client = ctx.client;
        if (!requireMusic(ctx)) return;
        if (!requireVoiceChannel(ctx)) return;

        const member = getMember(ctx);
        const guild = member.guild;

        if (!guild.members.me.permissions.has([PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak])) {
            const payload = { ...errorPanel('Permisos insuficientes', 'Necesito los permisos `Conectar` y `Hablar`.'), ephemeral: true };
            return (isSlash(ctx) ? ctx.reply(payload) : ctx.reply(payload)).catch(() => {});
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId('mood_select')
            .setPlaceholder('Elegí un estado de ánimo o género...')
            .addOptions(moods);

        const row = new ActionRowBuilder().addComponents(menu);
        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('### 🎵 Música para cada momento\nElegí una vibra para armar una mezcla al instante.'));

        const payload = { components: [container, row], flags: MessageFlags.IsComponentsV2 };
        const msg = await replyAndGetMessage(ctx, payload);
        if (!msg) return;

        const userId = isSlash(ctx) ? ctx.user.id : ctx.author.id;
        const requester = isSlash(ctx) ? ctx.user : ctx.author;
        const guildId = guild.id;

        const collector = msg.createMessageComponentCollector({
            filter: (i) => i.user.id === userId,
            time: 60000,
            max: 1,
        });

        collector.on('collect', async (interaction) => {
            const choice = moods.find((m) => m.value === interaction.values[0]);
            await interaction.update({ components: [statusContainer(`⏳ Armando tu mezcla **${choice.label}**...`)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

            const voiceChannel = getMember(ctx)?.voice?.channel;
            if (!voiceChannel) {
                return msg.edit({ components: [statusContainer('⚠️ Saliste del canal de voz.')], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }

            let player = client.music.players.get(guildId);
            if (!player) {
                try {
                    player = await client.music.createPlayer({
                        guildId, voiceId: voiceChannel.id, textId: ctx.channelId || ctx.channel?.id, volume: 80, deaf: true,
                    });
                } catch (err) {
                    // Este comando edita un panel de status en vez de
                    // responder una interaction, así que el aviso se emite
                    // en texto plano: no hay panel que mostrar acá.
                    if (isNoNodeError(err)) {
                        console.error('[mood] Sin nodo de Lavalink:', err.message);
                        return msg.edit({
                            components: [statusContainer('🔌 La música no está conectada: el bot no logró conectarse a ningún servidor de música (Lavalink). Probá de nuevo en un rato.')],
                            flags: MessageFlags.IsComponentsV2,
                        }).catch(() => {});
                    }
                    return msg.edit({ components: [statusContainer(`❌ No pude unirme al canal de voz: ${err.message}`)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
                }
            }

            let result;
            try {
                result = await player.search(choice.value, { requester });
            } catch (_) {
                result = { tracks: [] };
            }

            const tracks = (result?.tracks || []).slice(0, 15);
            if (tracks.length === 0) {
                return msg.edit({ components: [statusContainer(`❌ No encontré canciones para **${choice.label}**.`)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }

            tracks.forEach((t) => player.queue.add(t));
            if (!player.playing && !player.paused) await player.play();

            return msg.edit({ components: [statusContainer(`✅ Agregué **${tracks.length}** canciones a tu mezcla **${choice.label}**.`)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        });

        collector.on('end', (collected) => {
            if (collected.size === 0) {
                msg.edit({ components: [statusContainer('ℹ️ La selección expiró.')], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }
        });
    },
};
