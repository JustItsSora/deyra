// src/music/filters/index.js
//
// Aplicar y quitar filtros de audio sobre el reproductor de Kazagumo.
//
// POR QUÉ ESTO EXISTE: el bot de música viejo tenía su propio wrapper de
// player (src/structures/music/Player.ts) con métodos `setFilters()` y
// `clearFilters()`. Deyra usa Kazagumo, que NO expone esos métodos en su API
// pública: solo tiene el getter `player.filters`, que devuelve el objeto vivo
// del player de Shoukaku (modificarlo en el lugar no le avisa a Lavalink).
// Por eso todo pasa por `player.shoukaku`, que es el player real.
//
// El filtro activo se anota en `player.data` (que es un Map en memoria) para
// poder mostrarlo en el panel y para saber si hay que reaplicarlo: Lavalink
// pierde los filtros cuando salta a la siguiente pista de la cola, así que
// el evento playerStart los vuelve a aplicar.

const { PRESETS, PRESET_NAMES, isPreset, toFilterOptions } = require('./presets');

const DATA_ACTIVE = 'filter:active';
const DATA_UPDATED_AT = 'filter:updatedAt';

/** Player de Shoukaku detrás de un KazagumoPlayer (o el mismo player). */
function shoukakuPlayer(player) {
    return player?.shoukaku || player;
}

/**
 * Aplica un preset. Si el player está pausado no se toca nada: Lavalink
 * acepta los filtros pero el cambio recién se escucha al reanudar, y el
 * panel muestra el estado real recién ahí.
 *
 * @returns {Promise<{ok: boolean, error?: string}>}
 */
async function applyFilter(player, name) {
    if (!isPreset(name)) return { ok: false, error: `Preset desconocido: ${name}` };

    const lava = shoukakuPlayer(player);
    if (!lava?.setFilters) return { ok: false, error: 'El reproductor no soporta filtros.' };

    try {
        await lava.setFilters(toFilterOptions(name));
        player.data?.set(DATA_ACTIVE, name.toLowerCase());
        player.data?.set(DATA_UPDATED_AT, Date.now());
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

/** Quita todos los filtros. Mismo criterio que applyFilter con la pausa. */
async function clearFilter(player) {
    const lava = shoukakuPlayer(player);
    if (!lava?.clearFilters) return { ok: false, error: 'El reproductor no soporta filtros.' };

    try {
        await lava.clearFilters();
        player.data?.set(DATA_ACTIVE, null);
        player.data?.set(DATA_UPDATED_AT, Date.now());
        return { ok: true };
    } catch (err) {
        return { ok: false, error: err.message };
    }
}

/**
 * Vuelve a aplicar el filtro activo sobre la pista que arranca.
 *
 * Se llama desde el evento playerStart porque Lavalink NO arrastra los filtros
 * de una pista a la siguiente: sin esto, /filter nightcore se escuchaba en una
 * canción y en la siguiente volvía al sonido normal sin avisar. Es el mismo
 * problema que reportaban los servidores: "el filtro se pierde a las dos
 * canciones".
 */
async function reapplyIfActive(player) {
    const active = player.data?.get(DATA_ACTIVE);
    if (!active || !isPreset(active)) return false;

    const lava = shoukakuPlayer(player);
    if (!lava?.setFilters) return false;

    try {
        await lava.setFilters(toFilterOptions(active));
        return true;
    } catch (err) {
        console.error('[filters] No se pudo reaplicar el filtro:', err.message);
        return false;
    }
}

/** Nombre del preset activo, o null. */
function activeFilter(player) {
    return player.data?.get(DATA_ACTIVE) || null;
}

/** true si Lavalink (o el bot) está en medio de un cambio de filtro. */
function isStale(player, message) {
    const updatedAt = player.data?.get(DATA_UPDATED_AT);
    if (!updatedAt) return false;
    const messageTime = message?.editedTimestamp || message?.createdTimestamp || Date.now();
    return updatedAt > messageTime;
}

/** Datos de un preset para mostrar en un panel. */
function describe(name) {
    if (!isPreset(name)) return null;
    const preset = PRESETS[name.toLowerCase()];
    return {
        key: name.toLowerCase(),
        label: preset.label,
        description: preset.description,
        hasSpeed: !!preset.timescale,
        hasRotation: !!preset.rotation,
        hasLowPass: !!preset.lowPass,
    };
}

module.exports = {
    PRESETS,
    PRESET_NAMES,
    isPreset,
    describe,
    applyFilter,
    clearFilter,
    reapplyIfActive,
    activeFilter,
    isStale,
    DATA_ACTIVE,
    DATA_UPDATED_AT,
};
