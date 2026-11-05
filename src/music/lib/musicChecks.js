// src/music/lib/musicChecks.js
// Validaciones comunes reutilizadas por todos los comandos de música
// (play, skip, queue, etc). Funcionan tanto para slash como para prefijo
// porque usan el ctx unificado de src/lib/reply.js.

const { reply, isSlash, getMember } = require('../../lib/reply');
const { errorPanel, warningPanel } = require('../../lib/panel');
const { getMusicConfig, applySettingsToPlayer } = require('./musicConfig');

/**
 * Nodo de Lavalink conectado ahora mismo, o null si no hay ninguno.
 *
 * Que `client.music` exista NO significa que la música funcione: el manager se
 * crea al boot aunque ningún nodele responda. El estado real está en el estado
 * de conexión de cada nodo, así que la pregunta correcta no es "existe el
 * manager" sino "hay algún nodo conectado".
 */
function liveNode(manager) {
    const nodes = manager?.shoukaku?.nodes;
    if (!nodes?.size) return null;
    // Shoukaku ya sabe elegir el mejor: filtra los conectados y los ordena por
    // penalización. Reutilizamos su resolver para que el bot elija exactamente
    // el mismo nodo que elegiría la librería.
    if (typeof manager.shoukaku.nodeResolver === 'function') {
        return manager.shoukaku.nodeResolver(nodes) || null;
    }
    return [...nodes.values()].find(n => n.state === 1) || null;
}

/** ¿El error viene de que no hay ningún nodo de Lavalink disponible? */
function isNoNodeError(err) {
    return /no node found|no nodes available|node not found/i.test(err?.message || '');
}

/**
 * Panel de "no hay servidor de música conectado".
 *
 * Antes el usuario veía "No pude conectarme al canal de voz: No node found",
 * que apunta al lugar equivocado: el bot entra bien al canal, lo que falla es
 * que no se conectó al servidor de música. Decirlo claro evita que el usuario
 * pida ayuda por permisos que ya tiene, y le da a quien administra el bot el
 * dato exacto de qué revisar.
 */
function noNodePanel(manager) {
    const total = manager?.shoukaku?.nodes?.size || 0;
    const detalle = total === 0
        ? 'No hay ningún nodo de Lavalink cargado en la configuración del bot.'
        : total === 1
            ? 'Hay **1** nodo configurado, pero no respondió al conectarse.'
            : `Hay **${total}** nodos configurados, pero ninguno respondió.`;

    return errorPanel({
        category: 'música',
        title: 'La música no está conectada',
        kicker: 'Sin servidor de música',
        icon: '🔌',
        description: 'El bot entra bien al canal de voz, pero no puede buscar ni reproducir porque no se conectó a ningún servidor de música.',
        lists: [{
            title: 'Para revisarlo (lo hace quien administra el bot)',
            items: [
                detalle,
                'Casi siempre es que el nodo está caído, no que falte un permiso en el server.',
                'Se arregla en el `.env` con `LAVALINK_URL` y `LAVALINK_PASSWORD` correctos, y reiniciando el bot.',
                'Los nodos Lavalink públicos gratuitos se caen seguido: por eso conviene tener uno propio.',
            ],
        }],
    });
}

/**
 * Verifica que la música esté usable: manager cargado Y algún nodo conectado.
 *
 * Todos los comandos de música pasan por acá (play, join, search, mood,
 * artistradio, move, y los ~29 que solo tocan un player existente), así que
 * este chequeo es el que decide si el usuario ve un error útil o un
 * "No node found" crudo.
 */
function requireMusic(ctx) {
    const manager = ctx.client.music;
    if (!manager) {
        reply(ctx, { ...errorPanel('Música no disponible', 'El módulo de música no está configurado en este bot todavía.'), ephemeral: true });
        return false;
    }
    if (!liveNode(manager)) {
        reply(ctx, { ...noNodePanel(manager), ephemeral: true });
        return false;
    }
    return true;
}

/** Verifica que quien ejecuta el comando esté en un canal de voz. */
function requireVoiceChannel(ctx) {
    const member = getMember(ctx);
    if (!member?.voice?.channel) {
        reply(ctx, { ...warningPanel('Canal de voz requerido', 'Tenés que estar en un canal de voz para usar este comando.'), ephemeral: true });
        return false;
    }
    return true;
}

/** Verifica que exista un reproductor activo en este servidor. Devuelve el player o false. */
function requirePlayer(ctx) {
    const guildId = ctx.guildId || ctx.guild?.id;
    const player = ctx.client.music.players.get(guildId);
    if (!player) {
        reply(ctx, { ...warningPanel('Sin reproducción activa', 'No hay ningún reproductor de música activo en este servidor.'), ephemeral: true });
        return false;
    }
    return player;
}

/** Verifica que quien ejecuta esté en el mismo canal de voz que el bot. */
function requireSameVoiceChannel(ctx, player) {
    const member = getMember(ctx);
    if (!member?.voice?.channel || member.voice.channel.id !== player.voiceId) {
        reply(ctx, { ...warningPanel('Canal de voz distinto', 'Tenés que estar en el mismo canal de voz que el bot para usar esto.'), ephemeral: true });
        return false;
    }
    return true;
}

/**
 * Devuelve el player del guild, creándolo si hace falta, y con los ajustes
 * del servidor ya aplicados (volumen, autoplay, fairplay, 24/7).
 *
 * Este bloque estaba COPIADO en seis comandos (play, join, move, search, mood,
 * artistradio) con variations: /join y /move ponían `volume: 80` hardcodeado
 * en vez de leer el default del servidor, así que un admin que configuraba
 * volumen bajo se loenian solo en esos dos comandos. Centralizado acá, los
 * seis se comportan igual y el default se lee de un solo lugar.
 *
 * @returns {Promise<object|false>} el player, o `false` si ya respondió un
 *          error (el comando tiene que cortar con `if (!player) return`).
 */
async function requireOrCreatePlayer(ctx, channel, { move = false } = {}) {
    const client = ctx.client;
    const guild = channel.guild;
    const textChannelId = ctx.channelId || ctx.channel?.id;

    const settings = await getMusicConfig(guild.id);

    let player = client.music.players.get(guild.id);

    if (player) {
        if (player.voiceId !== channel.id) {
            if (!move) {
                reply(ctx, { ...errorPanel('Ya estoy en otro canal', 'Ya estoy conectado a un canal de voz distinto en este servidor.'), ephemeral: true });
                return false;
            }
            player.setVoiceChannel(channel.id);
        }
        if (player.textId !== textChannelId) player.textId = textChannelId;

        // Un admin puede cambiar los ajustes con la música ya sonando.
        applySettingsToPlayer(player, settings);
        return player;
    }

    try {
        player = await client.music.createPlayer({
            guildId: guild.id,
            voiceId: channel.id,
            textId: textChannelId,
            volume: clampVolume(settings.defaultVolume),
            deaf: true,
        });
    } catch (err) {
        // El caso real que se nos venía: el nodo de música se cayó entre el
        // chequeo de requireMusic y acá (o nunca conectó y el manager igual lo
        // tiró). Decir "No pude conectarme al canal de voz" señalaba un
        // problema donde no lo hay: el canal está bien, lo que no está es el
        // servidor de música.
        if (isNoNodeError(err)) {
            console.error('[music] Sin nodo de Lavalink:', err.message);
            reply(ctx, { ...noNodePanel(client.music), ephemeral: true });
            return false;
        }
        reply(ctx, { ...errorPanel('No pude unirme', `No pude conectarme al canal de voz: ${err.message}`), ephemeral: true });
        return false;
    }

    applySettingsToPlayer(player, settings);
    return player;
}

/** Lavalink acepta 0-1000, pero aca el panel y el comando usan 0-100. */
function clampVolume(value) {
    const n = Number(value);
    if (!Number.isFinite(n)) return 80;
    return Math.max(0, Math.min(100, Math.round(n)));
}

module.exports = {
    requireMusic,
    requireVoiceChannel,
    requirePlayer,
    requireSameVoiceChannel,
    requireOrCreatePlayer,
    clampVolume,
    liveNode,
    isNoNodeError,
    noNodePanel,
    getMusicConfig,
    applySettingsToPlayer,
    reply,
    isSlash,
    getMember,
};
