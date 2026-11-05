// src/lib/duration.js
const ms = require('ms');

/**
 * Parsea un string de duración humana ("10m", "1h30m" no soportado por ms puro,
 * así que usamos ms() que sí soporta "1h", "30m", "2d", "1w" individualmente).
 * @returns {number|null} milisegundos, o null si no es parseable / es <=0
 */
function parseDuration(input) {
    if (!input) return null;
    const value = ms(String(input));
    if (typeof value !== 'number' || value <= 0) return null;
    return value;
}

/** Formatea milisegundos a un string legible en español, p.ej. "2 días, 3 horas". */
function formatDuration(msValue) {
    const seconds = Math.floor(msValue / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (days) parts.push(`${days}d`);
    if (hours) parts.push(`${hours}h`);
    if (minutes) parts.push(`${minutes}m`);
    if (secs && parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ') || '0s';
}

module.exports = { parseDuration, formatDuration };
