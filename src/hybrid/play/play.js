// src/hybrid/play/play.js
const {
    SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SectionBuilder,
    SeparatorBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
    PermissionsBitField,
} = require('discord.js');
const { reply, isSlash, getMember } = require('../../lib/reply');
const { errorPanel, successPanel } = require('../../lib/panel');
const { requireMusic, requireVoiceChannel, isNoNodeError, noNodePanel } = require('../../music/lib/musicChecks');
const { formatDuration, cleanAuthorName, truncateTitle, getCleanThumbnail } = require('../../music/lib/trackFormat');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('play')
        .setDescription('Reproduce una canción o lista desde YouTube, Spotify y más')
        .addStringOption((o) => o.setName('busqueda').setDescription('Nombre de la canción o un enlace').setRequired(true)),

    name: 'play',
    aliases: ['p'],
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const client = ctx.client;
        if (!requireMusic(ctx)) return;

        let query = isSlash(ctx) ? ctx.options.getString('busqueda') : args.join(' ');
        query = (query || '').trim().replace(/[<>]/g, '');
        const markdownMatch = query.match(/\[.*?\]\((https?:\/\/.*?)\)/);
        if (markdownMatch) query = markdownMatch[1];

        if (!query) {
            return reply(ctx, { ...errorPanel('Falta la búsqueda', 'Uso: `/play <nombre o enlace de la canción>`\nEjemplo: `/play imagine dragons believer`'), ephemeral: true });
        }

        if (!requireVoiceChannel(ctx)) return;
        const member = getMember(ctx);
        const channel = member.voice.channel;
        const guild = channel.guild;

        if (!guild.members.me.permissions.has([PermissionsBitField.Flags.Connect, PermissionsBitField.Flags.Speak])) {
            return reply(ctx, { ...errorPanel('Permisos insuficientes', 'Necesito los permisos `Conectar` y `Hablar` para reproducir música.'), ephemeral: true });
        }

        let player = client.music.players.get(guild.id);

        if (player && player.voiceId !== channel.id) {
            return reply(ctx, { ...errorPanel('Ya estoy en otro canal', 'Ya estoy conectado a un canal de voz distinto en este servidor.'), ephemeral: true });
        }

        const textChannelId = ctx.channelId || ctx.channel?.id;

        if (!player) {
            try {
                player = await client.music.createPlayer({
                    guildId: guild.id,
                    voiceId: channel.id,
                    textId: textChannelId,
                    volume: config.MUSIC.DEFAULT_VOLUME || 80,
                    deaf: true,
                });
            } catch (err) {
                // El caso real que se nos venía: el nodo de música se cayó entre
                // el chequeo de requireMusic y acá (o nunca conectó y el manager
                // igual lo tiró). Decir "No pude conectarme al canal de voz"
                // señalaba un problema donde no lo hay: el canal está bien, lo
                // que no está es el servidor de música.
                if (isNoNodeError(err)) {
                    console.error('[play] Sin nodo de Lavalink:', err.message);
                    return reply(ctx, { ...noNodePanel(ctx.client.music), ephemeral: true });
                }
                return reply(ctx, { ...errorPanel('No pude unirme', `No pude conectarme al canal de voz: ${err.message}`), ephemeral: true });
            }
        } else if (player.textId !== textChannelId) {
            player.textId = textChannelId;
        }

        const currentQueueSize = player.queue.size;
        const isPlaying = player.playing || player.paused;

        let searchResult;
        try {
            searchResult = await player.search(query, { requester: isSlash(ctx) ? ctx.user : ctx.author });
        } catch (_) {
            searchResult = { tracks: [] };
        }

        if (!searchResult?.tracks?.length) {
            return reply(ctx, { ...errorPanel('Sin resultados', `No encontré nada para "${query}".`), ephemeral: true });
        }

        const addedTracks = [];
        if (searchResult.type === 'PLAYLIST') {
            searchResult.tracks.forEach((track, i) => {
                const position = currentQueueSize + i + (isPlaying ? 1 : 0);
                player.queue.add(track);
                addedTracks.push({ track, position });
            });
        } else {
            const position = currentQueueSize + (isPlaying ? 1 : 0);
            player.queue.add(searchResult.tracks[0]);
            addedTracks.push({ track: searchResult.tracks[0], position });
        }

        if (!player.playing && !player.paused) {
            await player.play();
        }

        if (searchResult.type === 'PLAYLIST') {
            return reply(ctx, successPanel('Lista agregada', `Se agregaron **${addedTracks.length}** canciones de **${searchResult.playlistName}** a la cola.`));
        }

        const added = addedTracks[0];
        const requesterName = isSlash(ctx) ? ctx.user.username : ctx.author.username;

        const titleDisplay = new TextDisplayBuilder().setContent('### 🎵 Canción agregada');
        const infoDisplay = new TextDisplayBuilder().setContent(
            `> [**${truncateTitle(added.track.title)}**](${added.track.uri}) — \`${cleanAuthorName(added.track.author)}\`\n`
            + `> Posición \`#${added.position}\` • Duración \`${formatDuration(added.track.length)}\` • Pedido por \`${requesterName}\``,
        );

        const section = new SectionBuilder().addTextDisplayComponents(titleDisplay, infoDisplay);
        const thumbnail = getCleanThumbnail(added.track.thumbnail || added.track.artworkUrl);
        if (thumbnail) section.setThumbnailAccessory((t) => t.setURL(thumbnail));

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY).addSectionComponents(section);

        if (added.position > 0) {
            const removeButton = new ButtonBuilder()
                .setCustomId(`music_remove_${added.track.identifier}_${added.position}`)
                .setLabel('Quitar').setStyle(ButtonStyle.Danger);
            const playNextButton = new ButtonBuilder()
                .setCustomId(`music_playnext_${added.track.identifier}_${added.position}`)
                .setLabel('Reproducir siguiente').setStyle(ButtonStyle.Success)
                .setDisabled(added.position === 1);

            container.addSeparatorComponents(new SeparatorBuilder());
            container.addActionRowComponents(new ActionRowBuilder().addComponents(removeButton, playNextButton));
        }

        const payload = { components: [container], flags: MessageFlags.IsComponentsV2 };

        // Los botones "Quitar" / "Reproducir siguiente" ya NO montan un
        // collector acá: los maneja src/gateway/interactions/musicHandler.js,
        // que es el mismo dispatcher de todos los paneles de música. Antes cada
        // comando cerraba su propio collector de 5 minutos y el panel se
        // quedaba sin botones vivos aunque la música siguiera sonando.
        return reply(ctx, payload);
    },
};
