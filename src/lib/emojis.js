// src/lib/emojis.js
//
// Lee src/data/emojiCache.json (generado por `npm run emojis:upload`) y expone
// un helper `emoji(key)` que devuelve el string listo para usar en cualquier
// mensaje/embed/componente: "<:name:id>" o "<a:name:id>" si es animado.
//
// Si el cache no existe todavía (el usuario no ha corrido el script de subida),
// el bot NO debe crashear: cada llamada cae a un emoji unicode de reemplazo
// para que los comandos sigan siendo usables mientras se configura.

const fs = require('fs');
const path = require('path');

const CACHE_PATH = path.join(__dirname, '..', 'data', 'emojiCache.json');

// Fallbacks unicode — se usan solo si el emoji de aplicación aún no fue subido.
const FALLBACKS = {
    YES: '✅', NO: '❌', DENY: '🚫', SHIELD: '🛡️', BAN: '🔨', LOCK: '🔒',
    CROWN: '👑', CLOCK: '🕐', PIN: '📌', EYE: '👁️', SUPPORT: '🎧',
    HANDSHAKE: '🤝', CALENDAR: '📅', BUG: '🐛', WARNING: '⚠️', VPN: '🌐',
    ANGRY: '😠', WAVE: '👋', CLASH: '⚔️', DESCRIPTION: '📝', CAMERA: '📷',
    HEALTH: '❤️', AC: '❄️',
    TICK_GREEN: '✅', TICK_RED: '❌', TICK_GREY: '⬜',
    TICK_GREEN_ANIMATED: '✅', TICK_RED_ANIMATED: '❌', TICK_GREY_ANIMATED: '⬜',

    // Módulo de música
    MUSIC: '🎵', PREV: '⏮️', NEXT: '⏭️', PAUSE: '⏸️', RESUME: '▶️',
    STOP: '⏹️', LOOP: '🔁', SHUFFLE: '🔀', VOLUME: '🔊', QUEUE: '📜',
};

let cache = null;

function loadCache() {
    if (cache !== null) return cache;
    try {
        const raw = fs.readFileSync(CACHE_PATH, 'utf8');
        cache = JSON.parse(raw);
    } catch {
        cache = {};
    }
    return cache;
}

/**
 * Devuelve el emoji listo para usar en un mensaje.
 * @param {string} key - clave del catálogo, p.ej. 'YES', 'TICK_GREEN_ANIMATED'.
 * @returns {string} "<:name:id>", "<a:name:id>", o un fallback unicode.
 */
function emoji(key) {
    const data = loadCache();
    const entry = data[key];
    if (!entry) return FALLBACKS[key] || '❔';
    return `<${entry.animated ? 'a' : ''}:${entry.name}:${entry.id}>`;
}

/** Fuerza releer el cache del disco (útil tras correr el script de subida sin reiniciar). */
function reload() {
    cache = null;
    return loadCache();
}

/** true si ya se subieron los emojis (el cache tiene al menos una entrada). */
function isConfigured() {
    return Object.keys(loadCache()).length > 0;
}

module.exports = { emoji, reload, isConfigured };
