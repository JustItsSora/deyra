// src/gateway/interactions/musicHandler.js
//
// Botones persistentes del reproductor de música.
//
// Un handler de este tipo lo carga src/lib/eventLoader.js con el prefijo del
// nombre del archivo: "musicHandler.js" -> customIds que empiezan con "music_".
// Eso lo mete en el MISMO mapa que /help, /ticket y el resto, así que no hay
// que registrarlo en ningún otro lado.
//
// POR QUÉ EXISTE (y por qué no es lo que había antes):
//
//   Antes, cada comando que mostraba un panel con botones montaba su propio
//   `createMessageComponentCollector` con un `time` de 5 a 15 minutos, y cada
//   uno cerraba sobre el player que tenía en el momento. Eso daba tres
//   problemas concretos:
//
//     · el panel moría aunque la música siguiera sonando, y el usuario veía
//       botones que no hacían nada, sin ninguna explicación de por qué;
//     · dos paneles con el mismo customId ("music_pause") tenían cada uno su
//       propia copia del estado, así que un panel viejo podía pausar un player
//       distinto del que aparentaba;
//     · con 34 comandos de música, la lógica de permisos (mismo canal de voz,
//       fairplay, anti-spam) estaba duplicada en 34 lugares.
//
//   Acá hay UN lugar que resuelve el player desde el guild de la interacción
//   (nunca desde un closure viejo), aplica las mismas reglas a todos los
//   botones, y re-dibuja el panel del mensaje donde se hizo clic.

const { MessageFlags } = require('discord.js');
const config = require('../../config');
const { emoji } = require('../../lib/emojis');
const { safeDestroyPlayer } = require('../../music/utils/playerUtils');
const { buildPlayerPanel, playerPanelPayload } = require('../../music/ui/playerPanel');
const { buildFilterMenu } = require('../../music/ui/filterMenu');
const { applyFilter, clearFilter, isPreset, activeFilter } = require('../../music/filters');
const { fairplayAllows } = require('../../music/lib/musicConfig');

// Segundos entre un clic y otro del mismo usuario. Discord no limita los
// botones, así que sin esto se puede hacer clic 50 veces en "pausa" y el panel
// queda en un estado raro (y genera 50 eventos de update contra la API).
const BUTTON_COOLDOWN_MS = 1200;
const lastClick = new Map();

const FILTER_MENU = /^music_filter/;

/** ¿Este customId pertenece al menú de filtros y no al panel de reproducción? */
function isFilterMenuId(customId) {
    return FILTER_MENU.test(customId);
}

/** Player del guild de la interacción, o null. */
function playerOf(interaction) {
    const guildId = interaction.guildId || interaction.guild?.id;
    if (!guildId) return null;
    return interaction.client.music?.players?.get(guildId) || null;
}

/**
 * Chequeos comunes a todos los botones. Devuelve el motivo si hay que cortar,
 * o null si se puede seguir.
 *
 * @param {boolean} needTrack false para el menú de filtros, que se puede abrir
 *        sin canción sonando (es un catálogo).
 */
function guard(interaction, player, { needTrack = true } = {}) {
    if (!interaction.client.music) return 'La música no está configurada en este bot.';
    if (!player) return 'Ya no hay ningún reproductor activo en este servidor.';
    if (needTrack && !player.queue?.current) return 'No hay ninguna canción sonando.';

    if (!fairplayAllows(interaction.member, player)) {
        return 'En este servidor la música solo se controla con el rol autorizado.';
    }

    // El que aprieta tiene que estar con el bot, salvo que administre el
    // server: desde el celular, en otra habitación, cortar la música es válido.
    const member = interaction.member;
    const isStaff = member?.id === config.OWNER_ID || member?.permissions?.has?.('MuteMembers');
    if (!isStaff) {
        if (!member?.voice?.channelId) return 'Tenés que estar en un canal de voz para tocar la música.';
        if (member.voice.channelId !== player.voiceId) return 'Tenés que estar en el mismo canal de voz que el bot.';
    }

    return null;
}

function onCooldown(interaction, customId) {
    const key = `${interaction.user.id}:${customId.split('_').slice(0, 2).join('_')}`;
    const now = Date.now();
    if (now - (lastClick.get(key) || 0) < BUTTON_COOLDOWN_MS) return true;
    lastClick.set(key, now);
    return false;
}

/** Página del menú de filtros que pide este customId. */
function filterPageFromId(customId) {
    const match = customId.match(/^music_filter_page_(\d+)$/);
    return match ? parseInt(match[1], 10) : 0;
}

/** Componentes que corresponde dibujar para este customId. */
function componentsFor(interaction, player) {
    return isFilterMenuId(interaction.customId)
        ? [buildFilterMenu(player, filterPageFromId(interaction.customId))]
        : [buildPlayerPanel(player)];
}

/**
 * Saca el identifier de un customId de cola.
 *
 * /play arma `music_remove_<identifier>_<posicion>` (la posicion sirve para
 * deshabilitar el boton cuando la cancion ya es la primera). El identifier de
 * Lavalink es base62 sin guiones bajos, asi que si lo que queda al final es un
 * numero, es la posicion y se descarta. Si no, es parte del identifier.
 */
function identifierFrom(customId, prefix) {
    const rest = customId.slice(prefix.length);
    const cut = rest.lastIndexOf('_');
    if (cut > 0 && /^\d+$/.test(rest.slice(cut + 1))) return rest.slice(0, cut);
    return rest;
}

/** Aviso efímero corto: un clic en un botón no necesita un panel completo. */
async function notice(interaction, text) {
    const payload = { content: text, flags: MessageFlags.Ephemeral };
    if (interaction.replied || interaction.deferred) {
        return interaction.followUp(payload).catch(() => {});
    }
    return interaction.reply(payload).catch(() => {});
}

/**
 * Vuelve a dibujar el panel de reproducción con la posición real.
 *
 * Lo llama el evento playerUpdate (que antes era un stub vacío) para que la
 * barra del panel avance sola. Si el mensaje ya no se puede editar (borrado, o
 * más viejo que lo que Discord permite editar) se ignora en silencio: es un
 * detalle cosmético y no vale la pena molestar al usuario con un error.
 */
function refreshPanel(client, player) {
    const message = player.data?.get('message');
    if (!message?.edit) return Promise.resolve();

    return message.edit(playerPanelPayload(player)).catch(() => {});
}

module.exports = {
    refreshPanel,

    async handle(interaction) {
        const { customId } = interaction;
        const player = playerOf(interaction);

        const problem = guard(interaction, player, { needTrack: !isFilterMenuId(customId) });
        if (problem) return notice(interaction, `${emoji('WARNING')} ${problem}`);

        if (onCooldown(interaction, customId)) {
            return interaction.deferUpdate().catch(() => {});
        }

        try {
            const paused = !!player.paused;

            switch (true) {
                // ── Transporte ───────────────────────────────────────────────
                case customId === 'music_pause':
                    if (!paused) player.pause(true);
                    break;

                case customId === 'music_resume':
                    if (paused) player.pause(false);
                    break;

                case customId === 'music_skip':
                    player.skip();
                    return interaction.deferUpdate().catch(() => {});

                case customId === 'music_previous': {
                    const history = player.data.get('history') || [];
                    if (!history.length) return notice(interaction, `${emoji('WARNING')} No hay canción anterior.`);

                    const last = history[history.length - 1];
                    const result = await interaction.client.music
                        .search(last.uri, { requester: interaction.user })
                        .catch(() => null);

                    if (!result?.tracks?.length) {
                        return notice(interaction, `${emoji('WARNING')} No pude volver a cargar esa canción.`);
                    }

                    player.queue.unshift(result.tracks[0]);
                    history.pop();
                    player.data.set('history', history);
                    player.skip();
                    return interaction.deferUpdate().catch(() => {});
                }

                case customId === 'music_stop':
                    player.queue?.clear();
                    if (typeof player.setLoop === 'function') player.setLoop('none');
                    await safeDestroyPlayer(player);
                    return interaction.deferUpdate().catch(() => {});

                // ── Volumen ──────────────────────────────────────────────────
                case customId === 'music_volume_up':
                case customId === 'music_volume_down': {
                    const current = player.volume ?? 100;
                    const next = Math.max(0, Math.min(100, current + (customId.endsWith('up') ? 10 : -10)));
                    if (next === current) break;
                    await player.setVolume(next);
                    break;
                }

                // ── Loop y autoplay ──────────────────────────────────────────
                case customId === 'music_loop': {
                    const order = ['none', 'track', 'queue'];
                    player.setLoop(order[(order.indexOf(player.loop || 'none') + 1) % order.length]);
                    break;
                }

                case customId === 'music_autoplay': {
                    // Autoplay TODO del lado de Deyra (evento playerEnd.js): acá
                    // SOLO se cambia el flag. Lavalink tiene su propio autoplay
                    // y si los dos están activos se pisan (Lavalink reinicia la
                    // pista, Deyra agrega otra, y quedan dos Sonando). Por eso
                    // playerStart.js deja el de Lavalink siempre apagado.
                    const next = !player.data.get('autoplay');
                    player.data.set('autoplay', next);
                    // Marca de que el usuario lo tocó a mano: el default del
                    // server no lo pisa en los siguientes cambios de estado.
                    player.data.set('autoplaySetByUser', true);
                    break;
                }

                // ── Filtros ──────────────────────────────────────────────────
                case customId === 'music_filter_clear':
                    if (activeFilter(player)) await clearFilter(player);
                    break;

                case /^music_filter_page_\d+$/.test(customId):
                    break; // solo navegación: el redibujo de abajo hace el resto

                case customId.startsWith('music_filter_'): {
                    const name = customId.slice('music_filter_'.length);
                    if (!isPreset(name)) return;
                    await applyFilter(player, name);
                    break;
                }

                // ── Cola: los botones que /play montaba con su collector ──────
                case customId.startsWith('music_remove_'): {
                    const identifier = identifierFrom(customId, 'music_remove_');
                    const idx = player.queue.findIndex((t) => t.identifier === identifier);
                    if (idx === -1) {
                        return notice(interaction, `${emoji('WARNING')} Esa canción ya no está en la cola.`);
                    }
                    player.queue.splice(idx, 1);
                    return interaction.deferUpdate().catch(() => {});
                }

                case customId.startsWith('music_playnext_'): {
                    const identifier = identifierFrom(customId, 'music_playnext_');
                    const idx = player.queue.findIndex((t) => t.identifier === identifier);
                    if (idx <= 0) {
                        return notice(interaction, `${emoji('WARNING')} Esa canción ya va primera.`);
                    }
                    const [moved] = player.queue.splice(idx, 1);
                    player.queue.unshift(moved);
                    return interaction.deferUpdate().catch(() => {});
                }

                default:
                    return;
            }

            return interaction.update({
                components: componentsFor(interaction, player),
                flags: MessageFlags.IsComponentsV2,
            }).catch(async (err) => {
                // Editar un mensaje muy viejo falla. No es culpa del usuario y
                // no hay nada que rehacer: se avisa efímero y se sigue.
                console.warn('[musicHandler] No se pudo editar el panel:', err?.message);
                await notice(interaction, `${emoji('WARNING')} Este panel quedó viejo. Usá \`/nowplaying\` para ver el estado actual.`);
            });
        } catch (err) {
            console.error('[musicHandler] Error procesando', customId, err);
            return notice(interaction, `${emoji('NO')} No pude completar la acción.`);
        }
    },
};
