// src/music/filters/presets.js
//
// Presets de ecualización. Puerto de src/commands/music/filter.ts del bot de
// música viejo (OpenUwU / Eleven Music, OUSL-1.0), con los mismos valores de
// ganancia: son los que funcionan, ajustarlos "un poquito" cambia cómo
// suena cada preset y no hay forma objetiva de decidir cuál es mejor.
//
// Lo que SÍ cambia respecto del bot viejo:
//
//   · Los presets se aplican con `player.shoukaku.setFilters()` en vez del
//     `player.setFilters()` de su wrapper propio, porque Deyra usa Kazagumo y
//     Kazagumo no expone setFilters en su API pública (solo el getter
//     `player.filters`, que devuelve el objeto vivo del player de Shoukaku).
//   · Nada de emojis hardcodeados del servidor del autor: los iconos salen de
//     src/lib/emojis.js, o sea del sistema de emojis propio de Deyra.
//
// CREDITOS: presets derivados de Eleven Music (github.com/openUwU/eleven),
// proyecto OpenUwU. Licencia OUSL-1.0: ver NOTICE.md en la raíz del repo.

const BANDS = 14; // Lavalink trabaja con 14 bandas (0-60Hz .. 16kHz)

const PRESETS = {
    bassboost: {
        label: 'Bassboost',
        description: 'Graves más profundos. Suena bien con trap, dubstep y reggaetón.',
        equalizer: [
            { band: 0, gain: 0.85 }, { band: 1, gain: 0.75 }, { band: 2, gain: 0.65 },
            { band: 3, gain: 0.45 }, { band: 4, gain: 0.25 }, { band: 5, gain: 0.0 },
            { band: 6, gain: -0.15 }, { band: 7, gain: -0.15 }, { band: 8, gain: -0.1 },
            { band: 9, gain: -0.05 }, { band: 10, gain: 0.0 }, { band: 11, gain: 0.0 },
            { band: 12, gain: 0.0 }, { band: 13, gain: 0.0 },
        ],
    },

    nightcore: {
        label: 'Nightcore',
        description: 'Más aguda y un 25% más rápida. El clásico de las room de Discord.',
        equalizer: [
            { band: 0, gain: 0.15 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.35 },
            { band: 3, gain: 0.45 }, { band: 4, gain: 0.55 }, { band: 5, gain: 0.65 },
            { band: 6, gain: 0.75 }, { band: 7, gain: 0.85 }, { band: 8, gain: 0.75 },
            { band: 9, gain: 0.65 }, { band: 10, gain: 0.55 }, { band: 11, gain: 0.45 },
            { band: 12, gain: 0.35 }, { band: 13, gain: 0.25 },
        ],
        timescale: { speed: 1.25, pitch: 1.25, rate: 1.0 },
    },

    vaporwave: {
        label: 'Vaporwave',
        description: 'Lenta, grave y con aire de cinta vieja.',
        equalizer: [
            { band: 0, gain: 0.5 }, { band: 1, gain: 0.4 }, { band: 2, gain: 0.3 },
            { band: 3, gain: 0.2 }, { band: 4, gain: 0.0 }, { band: 5, gain: -0.1 },
            { band: 6, gain: -0.2 }, { band: 7, gain: -0.1 }, { band: 8, gain: 0.0 },
            { band: 9, gain: 0.1 }, { band: 10, gain: 0.1 }, { band: 11, gain: 0.0 },
            { band: 12, gain: 0.0 }, { band: 13, gain: 0.0 },
        ],
        timescale: { speed: 0.8, pitch: 0.8, rate: 1.0 },
    },

    pop: {
        label: 'Pop',
        description: 'Voz al frente y graves limpios. Pensado para charts.',
        equalizer: [
            { band: 0, gain: -0.15 }, { band: 1, gain: 0.5 }, { band: 2, gain: 0.65 },
            { band: 3, gain: 0.75 }, { band: 4, gain: 0.6 }, { band: 5, gain: 0.3 },
            { band: 6, gain: -0.1 }, { band: 7, gain: -0.2 }, { band: 8, gain: -0.15 },
            { band: 9, gain: -0.1 }, { band: 10, gain: 0.0 }, { band: 11, gain: 0.05 },
            { band: 12, gain: 0.1 }, { band: 13, gain: 0.0 },
        ],
    },

    rock: {
        label: 'Rock',
        description: 'Medios y agudos con más cuerpo.',
        equalizer: [
            { band: 0, gain: 0.6 }, { band: 1, gain: 0.5 }, { band: 2, gain: 0.2 },
            { band: 3, gain: 0.3 }, { band: 4, gain: 0.5 }, { band: 5, gain: 0.7 },
            { band: 6, gain: 0.75 }, { band: 7, gain: 0.65 }, { band: 8, gain: 0.5 },
            { band: 9, gain: 0.4 }, { band: 10, gain: 0.45 }, { band: 11, gain: 0.55 },
            { band: 12, gain: 0.6 }, { band: 13, gain: 0.4 },
        ],
    },

    electronic: {
        label: 'Electrónica',
        description: 'Graves reforzados y agudos brillantes.',
        equalizer: [
            { band: 0, gain: 0.75 }, { band: 1, gain: 0.65 }, { band: 2, gain: 0.4 },
            { band: 3, gain: 0.2 }, { band: 4, gain: 0.3 }, { band: 5, gain: 0.5 },
            { band: 6, gain: 0.65 }, { band: 7, gain: 0.8 }, { band: 8, gain: 0.85 },
            { band: 9, gain: 0.7 }, { band: 10, gain: 0.55 }, { band: 11, gain: 0.45 },
            { band: 12, gain: 0.35 }, { band: 13, gain: 0.25 },
        ],
    },

    lofi: {
        label: 'Lo-fi',
        description: 'Suave y amortiguado, para escuchar de fondo mientras estudiás.',
        equalizer: [
            { band: 0, gain: 0.5 }, { band: 1, gain: 0.45 }, { band: 2, gain: 0.35 },
            { band: 3, gain: 0.25 }, { band: 4, gain: 0.15 }, { band: 5, gain: 0.0 },
            { band: 6, gain: -0.15 }, { band: 7, gain: -0.25 }, { band: 8, gain: -0.35 },
            { band: 9, gain: -0.45 }, { band: 10, gain: -0.5 }, { band: 11, gain: -0.45 },
            { band: 12, gain: -0.4 }, { band: 13, gain: -0.35 },
        ],
        lowPass: { smoothing: 20 },
    },

    trap: {
        label: 'Trap',
        description: 'Sub-grave fuerte y agudos penetrantes.',
        equalizer: [
            { band: 0, gain: 0.8 }, { band: 1, gain: 0.75 }, { band: 2, gain: 0.55 },
            { band: 3, gain: 0.35 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0.0 },
            { band: 6, gain: 0.15 }, { band: 7, gain: 0.35 }, { band: 8, gain: 0.55 },
            { band: 9, gain: 0.7 }, { band: 10, gain: 0.8 }, { band: 11, gain: 0.7 },
            { band: 12, gain: 0.55 }, { band: 13, gain: 0.4 },
        ],
    },

    '8d': {
        label: '8D',
        description: 'Gira el audio alrededor de tu cabeza. Con auriculares.',
        equalizer: [
            { band: 0, gain: 0.25 }, { band: 1, gain: 0.3 }, { band: 2, gain: 0.35 },
            { band: 3, gain: 0.4 }, { band: 4, gain: 0.45 }, { band: 5, gain: 0.5 },
            { band: 6, gain: 0.55 }, { band: 7, gain: 0.55 }, { band: 8, gain: 0.5 },
            { band: 9, gain: 0.45 }, { band: 10, gain: 0.4 }, { band: 11, gain: 0.35 },
            { band: 12, gain: 0.3 }, { band: 13, gain: 0.25 },
        ],
        rotation: { rotationHz: 0.2 },
    },

    soft: {
        label: 'Soft',
        description: 'Redondea los picos. Ideal si la música te estresa.',
        equalizer: [
            { band: 0, gain: 0.2 }, { band: 1, gain: 0.25 }, { band: 2, gain: 0.3 },
            { band: 3, gain: 0.35 }, { band: 4, gain: 0.4 }, { band: 5, gain: 0.35 },
            { band: 6, gain: 0.25 }, { band: 7, gain: 0.15 }, { band: 8, gain: 0.0 },
            { band: 9, gain: -0.15 }, { band: 10, gain: -0.2 }, { band: 11, gain: -0.1 },
            { band: 12, gain: 0.0 }, { band: 13, gain: 0.05 },
        ],
    },

    treble: {
        label: 'Treble',
        description: 'Agudos al frente: percusión y brillos.',
        equalizer: [
            { band: 0, gain: -0.2 }, { band: 1, gain: -0.15 }, { band: 2, gain: -0.1 },
            { band: 3, gain: 0.0 }, { band: 4, gain: 0.1 }, { band: 5, gain: 0.25 },
            { band: 6, gain: 0.4 }, { band: 7, gain: 0.55 }, { band: 8, gain: 0.7 },
            { band: 9, gain: 0.8 }, { band: 10, gain: 0.85 }, { band: 11, gain: 0.8 },
            { band: 12, gain: 0.7 }, { band: 13, gain: 0.6 },
        ],
    },
};

const PRESET_NAMES = Object.keys(PRESETS);

/** Verifica que un nombre sea un preset válido (para slash y para botones). */
function isPreset(name) {
    return typeof name === 'string' && Object.prototype.hasOwnProperty.call(PRESETS, name.toLowerCase());
}

/**
 * Convierte un preset al objeto FilterOptions que espera Lavalink v4.
 * Se manda TODO el set de filtros (no solo el equalizer) porque setFilters
 * reemplaza: mandar solo `equalizer` dejaría el timescale de nightcore
 * puesto para siempre.
 */
function toFilterOptions(name) {
    const preset = PRESETS[name.toLowerCase()];
    if (!preset) return null;

    const options = {};
    if (preset.equalizer) {
        options.equalizer = Array.from({ length: BANDS }, (_, band) => ({
            band,
            gain: preset.equalizer[band]?.gain ?? 0,
        }));
    }
    if (preset.timescale) options.timescale = { ...preset.timescale };
    if (preset.rotation) options.rotation = { ...preset.rotation };
    if (preset.lowPass) options.lowPass = { ...preset.lowPass };
    return options;
}

module.exports = { PRESETS, PRESET_NAMES, isPreset, toFilterOptions, BANDS };
