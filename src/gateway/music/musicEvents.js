// src/gateway/music/musicEvents.js
//
// "Salir si el canal queda vacío" (leaveOnEmptyMs del panel y de /musicconfig).
//
// Antes este ajuste existía en la base y en el panel, pero nadie lo leía: el
// bot se quedaba conectado a un canal vacío para siempre. Discord ya avisa cada
// movimiento de voz con voiceStateUpdate, así que acá solo se mira el canal
// donde vive el reproductor.
//
// Reglas:
//   · 24/7 manda: con stay247 el bot no se va nunca, aunque el canal esté vacío.
//   · 0 segundos en leaveOnEmptyMs = ajuste desactivado.
//   · Al disparar se revalida todo (player vivo, canal, gente, 24/7): entre el
//     temporizador y el momento de irse puede haber vuelto alguien.

const { infoPanel } = require('../../lib/panel');
const { safeDestroyPlayer } = require('../../music/utils/playerUtils');

const EMPTY_TIMER_KEY = 'emptyChannelTimeout';

/** Personas reales escuchando (los bots no cuentan). */
function humanListeners(channel, client) {
    return channel.members.filter((m) => !m.user.bot && m.id !== client.user?.id).size;
}

function clearTimer(player) {
    const existing = player.data?.get(EMPTY_TIMER_KEY);
    if (existing) {
        clearTimeout(existing);
        player.data.delete(EMPTY_TIMER_KEY);
    }
}

async function handleVoiceState(client, oldState, newState) {
    const guild = newState.guild || oldState.guild;
    if (!guild) return;

    const player = client.music?.players?.get(guild.id);
    if (!player || player.state === 'DESTROYED') return;

    const channelId = player.voiceId;
    if (!channelId) return;

    // Solo interesa lo que pasa en el canal del reproductor.
    if (oldState.channelId !== channelId && newState.channelId !== channelId) return;

    const channel = guild.channels.cache.get(channelId);
    if (!channel) return;

    clearTimer(player);

    if (player.data?.get('stay247')) return;
    if (humanListeners(channel, client) > 0) return;

    const leaveMs = Number(player.data?.get('leaveOnEmptyMs'));
    if (!Number.isFinite(leaveMs) || leaveMs <= 0) return;

    const timer = setTimeout(async () => {
        player.data?.delete(EMPTY_TIMER_KEY);
        try {
            const live = client.music?.players?.get(guild.id);
            if (!live || live.state === 'DESTROYED') return;
            if (live.data?.get('stay247')) return;

            const currentChannel = guild.channels.cache.get(live.voiceId);
            if (!currentChannel || humanListeners(currentChannel, client) > 0) return;

            client.channels.cache.get(live.textId)?.send(
                infoPanel('Canal vacío', 'Me fui del canal de voz porque no quedaba nadie escuchando. Usá `/play` cuando quieras volver.'),
            ).catch(() => {});

            await safeDestroyPlayer(live);
        } catch (err) {
            console.error('[music] Error al salir del canal vacío:', err.message);
        }
    }, leaveMs);

    timer.unref?.();
    player.data?.set(EMPTY_TIMER_KEY, timer);
}

function init(client) {
    client.on('voiceStateUpdate', (oldState, newState) => {
        handleVoiceState(client, oldState, newState).catch((err) => {
            console.error('[music] Error en voiceStateUpdate:', err.message);
        });
    });
}

module.exports = { init };
