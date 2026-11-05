// src/music/ui/playerPanel.js
//
// Panel de "Now Playing" con controles. UNA sola implementación para todos los
// lugares que lo necesitan:
//
//   · el evento playerStart (manda el panel al canal de texto),
//   · /nowplaying (lo consulta sin poner música),
//   · el musicHandler (lo re-dibuja cuando alguien aprieta un botón).
//
// Antes de la fusión esto estaba dentro de playerStart.js, que además montaba
// su propio collector de botones con vida de 5-15 minutos. Separlas arregla dos
// cosas concretas:
//
//   1. /nowplaying mostraba un panel distinto (sin botones y con una barra de
//      progreso rota: el ternario de las dos ramas daba lo mismo, así que
//      la barra nunca se llenaba). Ahora usa el mismo panel que el canal.
//
//   2. Los botones morían con el collector. Ahora los maneja el dispatcher
//      global (src/gateway/interactions/musicHandler.js) y viven mientras el
//      player exista, que es lo que la gente espera: el panel de la canción que
//      dejó de sonar hace 20 minutos todavía responde.
//
// CREDITOS: la fila de ajustes (volumen, autoplay, loop, favorito) y el panel
// de settings por modal vienen de Eleven Music (github.com/openUwU/eleven),
// OUSL-1.0. Ver NOTICE.md.

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const config = require('../../config');
const ui = require('../../lib/ui');
const { emoji } = require('../../lib/emojis');
const { formatDuration, cleanAuthorName, truncateTitle, getCleanThumbnail } = require('../lib/trackFormat');
const { activeFilter, describe: describeFilter } = require('../filters');

const LOOP_LABEL = { none: 'Loop', track: 'Loop 1', queue: 'Loop todo' };

/** Segundos transcurridos de la pista actual (0 si no se sabe). */
function currentPosition(player) {
    const track = player.queue?.current;
    if (!track) return 0;
    if (typeof player.position === 'number' && player.position > 0) return player.position;
    if (player.data?.get('startedAt')) {
        return Math.max(0, Math.floor((Date.now() - player.data.get('startedAt')) / 1000));
    }
    return 0;
}

/**
 * @param {object} player KazagumoPlayer
 * @param {object} [opts]
 * @param {number} [opts.position] segundos transcurridos (por defecto, los del player)
 * @param {boolean} [opts.compact] sin barra de progreso (para /nowplaying efímero)
 * @returns {import('discord.js').ContainerBuilder}
 */
function buildPlayerPanel(player, { position, compact = false } = {}) {
    const track = player.queue?.current || player.data?.get('currentTrack');
    const paused = !!player.paused;
    const loop = player.loop || 'none';
    const volume = player.volume ?? 100;
    const queued = player.queue?.size || 0;
    const filter = activeFilter(player);
    const pos = typeof position === 'number' ? position : currentPosition(player);

    if (!track) {
        return ui.buildOne({
            category: 'música',
            kicker: 'Música',
            title: 'No hay nada sonando',
            icon: emoji('MUSIC'),
            description: 'No hay ninguna canción en reproducción en este canal de voz.',
        });
    }

    // ── Fila 1: transporte ────────────────────────────────────────────────────
    const transportRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_previous')
            .setEmoji(emoji('PREV'))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(!(player.data?.get('history') || []).length),
        new ButtonBuilder()
            .setCustomId(paused ? 'music_resume' : 'music_pause')
            .setEmoji(paused ? emoji('RESUME') : emoji('PAUSE'))
            .setStyle(ButtonStyle.Primary),
        new ButtonBuilder()
            .setCustomId('music_skip')
            .setEmoji(emoji('NEXT'))
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(queued === 0 && !player.loop),
        new ButtonBuilder()
            .setCustomId('music_stop')
            .setEmoji(emoji('STOP'))
            .setStyle(ButtonStyle.Danger),
    );

    // ── Fila 2: ajustes ───────────────────────────────────────────────────────
    // Cinco botones es el tope por fila de Discord. Los que se repiten entre
    // topics (loop/autoplay) se cyclingean en vez de sumar una fila más.
    const settingsRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('music_volume_down')
            .setEmoji('🔉')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(volume <= 0),
        new ButtonBuilder()
            .setCustomId('music_volume_up')
            .setEmoji('🔊')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(volume >= 100),
        new ButtonBuilder()
            .setCustomId('music_loop')
            .setLabel(LOOP_LABEL[loop] || 'Loop')
            .setStyle(loop === 'none' ? ButtonStyle.Secondary : ButtonStyle.Success),
        new ButtonBuilder()
            .setCustomId('music_autoplay')
            .setEmoji(emoji('SHUFFLE'))
            .setStyle(player.data?.get('autoplay') ? ButtonStyle.Success : ButtonStyle.Secondary),
        new ButtonBuilder()
            .setCustomId('music_filter_clear')
            .setLabel(filter ? describeFilter(filter)?.label || 'Filtro' : 'Filtros')
            .setStyle(filter ? ButtonStyle.Success : ButtonStyle.Secondary),
    );

    // La barra va como línea de texto y NO como medidor, por una razón
    // concreta: `meter()` imprime `valor/máximo` con los números crudos, y con
    // la posición en segundos y la duración en milisegundos eso salía como
    // "42000/217000 11:40:00 / 3:37". Ahora la barra se calcula en
    // milisegundos (las dos unidades) y los tiempos salen formateados.
    const lineas = [];

    if (!compact && track.length > 0) {
        const posMs = Math.min(pos * 1000, track.length);
        const bar = ui.progressBar(posMs, track.length, { size: 16, style: 'rounded' });
        lineas.push(`\`${formatDuration(posMs)} / ${formatDuration(track.length)}\`  ${bar}`);
    } else if (!compact) {
        lineas.push('**En vivo** (sin duración fija)');
    }

    const statusBits = [];
    if (paused) statusBits.push('⏸️ En pausa');
    // El volumen va en la línea de estado porque los botones de 🔉/🔊 lo
    // cambian pero no lo muestran: sin este número el usuario no tiene forma
    // de saber a qué quedó.
    if (volume > 0) statusBits.push(`🔊 ${volume}%`);
    if (queued > 0) statusBits.push(`📜 ${queued} en cola`);
    if (loop !== 'none') statusBits.push(`🔁 ${LOOP_LABEL[loop]}`);
    if (player.data?.get('stay247')) statusBits.push('🕐 24/7');
    if (player.data?.get('fairplay')) statusBits.push('🛡️ Fairplay');
    if (statusBits.length) lineas.push(statusBits.join(' • '));

    return ui.buildOne({
        category: 'música',
        kicker: paused ? 'En pausa' : 'Reproduciendo ahora',
        title: truncateTitle(track.title, 55),
        icon: emoji('MUSIC'),
        description: `[**${cleanAuthorName(track.author)}**](${track.uri || 'https://youtube.com'})`,
        media: getCleanThumbnail(track.thumbnail || track.artworkUrl),
        fields: lineas.length ? lineas : undefined,
        rows: [transportRow, settingsRow],
        // El volumen como medidor: 0-100 se lee bien en `valor/máximo`, que es
        // justo el caso donde ese formato sirve de algo.
        footerText: `Pedido por ${track.requester?.username || 'alguien'}`,
    });
}

/** Payload listo para `reply()` / `editReply()` / `interaction.update()`. */
function playerPanelPayload(player, opts) {
    return { components: [buildPlayerPanel(player, opts)], flags: MessageFlags.IsComponentsV2 };
}

module.exports = { buildPlayerPanel, playerPanelPayload, currentPosition, LOOP_LABEL };
