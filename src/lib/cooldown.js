// src/lib/cooldown.js
// Cooldown en memoria por (comando, usuario). Suficiente para una sola instancia del bot.
// Para multi-instancia, cambiar el Map interno por Redis manteniendo la misma API.

const cooldowns = new Map(); // key: `${command}:${userId}` -> timestamp de expiración

/**
 * @param {string} command - nombre del comando
 * @param {string} userId
 * @param {number} durationMs
 * @returns {number} milisegundos restantes (0 si no hay cooldown activo)
 */
function check(command, userId, durationMs) {
    const key = `${command}:${userId}`;
    const expiresAt = cooldowns.get(key);
    const now = Date.now();

    if (expiresAt && expiresAt > now) {
        return expiresAt - now;
    }

    cooldowns.set(key, now + durationMs);
    return 0;
}

/** Limpia un cooldown manualmente (p.ej. si el comando falló y no debería contar). */
function reset(command, userId) {
    cooldowns.delete(`${command}:${userId}`);
}

module.exports = { check, reset };
