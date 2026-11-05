// src/hybrid/search/search.js
const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle, ContainerBuilder,
    TextDisplayBuilder, SeparatorBuilder, MessageFlags, PermissionsBitField,
    SlashCommandBuilder,
} = require('discord.js');
const { isSlash, getMember, replyAndGetMessage } = require('../../lib/reply');
const { errorPanel, infoPanel } = require('../../lib/panel');
const { requireMusic, requireVoiceChannel, isNoNodeError, noNodePanel } = require('../../music/lib/musicChecks');
const config = require('../../config');

function formatDuration(ms) {
    if (!ms || ms <= 0) return 'En vivo';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function statusContainer(text) {
    return new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(text));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('search')
        .setDescription('Busca canciones y elegí una para agregar a la cola')
        .addStringOption((o) => o.setName('busqueda').setDescription('Nombre de la canción').setRequired(true)),

    name: 'search',
    aliases: ['find'],
    category: 'música',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const client = ctx.client;
        if (!requireMusic(ctx)) return;

        const query = isSlash(ctx) ? ctx.options.getString('busqueda') : args.join(' ');
        if (!query) {
            const payload = { ...errorPanel('Falta la búsqueda', 'Uso: `/search busqueda:<nombre de la canción>`\nEjemplo: `/search imagine dragons believer`'), ephemeral: true };
            return (isSlash(ctx) ? ctx.reply(payload) : ctx.reply(payload)).catch(() => {});
        }

        if (!requireVoiceChannel(ctx)) return;
        const member = getMember(ctx);
        const channel = member.voice.channel;
        const guild = channel.guild;

        if (!guild.members.me.permissions.has([PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak])) {
            const payload = { ...errorPanel('Permisos insuficientes', 'Necesito los permisos `Conectar` y `Hablar`.'), ephemeral: true };
            return (isSlash(ctx) ? ctx.reply(payload) : ctx.reply(payload)).catch(() => {});
        }

        let player = client.music.players.get(guild.id);
        const textChannelId = ctx.channelId || ctx.channel?.id;

        if (!player) {
            try {
                player = await client.music.createPlayer({ guildId: guild.id, voiceId: channel.id, textId: textChannelId, volume: 80, deaf: true });
            } catch (err) {
                // Nodo caído = problema del servidor de música, no del canal de
                // voz. Sin esto el usuario veía el "No node found" crudo.
                if (isNoNodeError(err)) {
                    console.error('[search] Sin nodo de Lavalink:', err.message);
                    const payload = { ...noNodePanel(client.music), ephemeral: true };
                    return (isSlash(ctx) ? ctx.reply(payload) : ctx.reply(payload)).catch(() => {});
                }
                const payload = { ...errorPanel('No pude unirme', err.message), ephemeral: true };
                return (isSlash(ctx) ? ctx.reply(payload) : ctx.reply(payload)).catch(() => {});
            }
        }

        const requester = isSlash(ctx) ? ctx.user : ctx.author;
        const userId = requester.id;

        const searchingPayload = { components: [statusContainer(`⏳ Buscando **${query}**...`)], flags: MessageFlags.IsComponentsV2 };
        const searching = await replyAndGetMessage(ctx, searchingPayload);
        if (!searching) return;

        let result;
        try {
            result = await player.search(query, { requester });
        } catch (_) {
            result = { tracks: [] };
        }

        const tracks = (result?.tracks || []).slice(0, 5);
        if (tracks.length === 0) {
            return searching.edit({ components: [statusContainer(`❌ No encontré resultados para **${query}**.`)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }

        const list = tracks.map((t, i) => `**\`${i + 1}\`** | [${t.title}](${t.uri}) — \`${formatDuration(t.length)}\``).join('\n');

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('### 🔎 Resultados de búsqueda'))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(list))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('-# Tocá un número para agregar esa canción a la cola.'));

        const row = new ActionRowBuilder().addComponents(
            tracks.map((_, i) => new ButtonBuilder().setCustomId(`search_pick_${i}`).setLabel(`${i + 1}`).setStyle(ButtonStyle.Secondary)),
        );
        const cancelRow = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('search_cancel').setLabel('Cancelar').setStyle(ButtonStyle.Danger),
        );

        await searching.edit({ components: [container, row, cancelRow], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

        const collector = searching.createMessageComponentCollector({
            filter: (i) => i.user.id === userId,
            time: 30000,
            max: 1,
        });

        collector.on('collect', async (interaction) => {
            if (interaction.customId === 'search_cancel') {
                return interaction.update({ components: [statusContainer('ℹ️ Búsqueda cancelada.')], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }

            const idx = parseInt(interaction.customId.replace('search_pick_', ''), 10);
            const track = tracks[idx];
            if (!track) return;

            player.queue.add(track);
            if (!player.playing && !player.paused) await player.play();

            await interaction.update({ components: [statusContainer(`✅ Agregué [${track.title}](${track.uri}) a la cola.`)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        });

        collector.on('end', (collected) => {
            if (collected.size === 0) {
                searching.edit({ components: [statusContainer('ℹ️ La búsqueda expiró.')], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }
        });
    },
};
