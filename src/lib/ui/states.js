// src/lib/ui/states.js
//
// Estados "no hay respuesta útil": error, vacío, cooldown, sin permisos,
// cargando. Antes cada comando inventaba su propio texto y a veces olvidata
// el `ephemeral`, así que un error interno se quedaba pegado en el canal.
//
// Regla: TODO estado negativo es efímero salvo que se pida lo contrario, lleva
// el color correcto, un símbolo (no solo color) y siempre dice qué hacer.

const { MessageFlags } = require('discord.js');
const { payload, privatePayload } = require('./panel');
const theme = require('./theme');
const text = require('./text');

/** Error con explicación. ephemeral por defecto. */
function error(title, description, { hint, ephemeral = true, tone = 'error', ...rest } = {}) {
    return {
        ...(ephemeral ? privatePayload : payload)({
            tone,
            kicker: 'Algo salió mal',
            title,
            icon: '⚠️',
            description,
            callouts: hint ? [{ tone: 'muted', text: hint }] : undefined,
            ...rest,
        }),
    };
}

/** Error genérico con el detalle técnico escondido (uso en catch). */
function internalError(err, { ephemeral = true, context } = {}) {
    if (err) console.error(`[ui] Error en panel:`, err);
    return error(
        'No pude completar eso',
        'Algo falló de mi lado al armar la respuesta. No es un problema tuyo: reintentá en unos segundos.',
        {
            hint: context ? `Contexto: ${context}` : undefined,
            ephemeral,
        },
    );
}

/** No hay resultados / lista vacía. */
function empty(title, description, { hint, ephemeral = true, ...rest } = {}) {
    return {
        ...(ephemeral ? privatePayload : payload)({
            tone: 'warning',
            kicker: 'Sin resultados',
            title,
            icon: '🕳️',
            description,
            callouts: hint ? [{ tone: 'muted', text: hint }] : undefined,
            ...rest,
        }),
    };
}

/** Falta un argumento obligatorio. ephemeral por defecto. */
function missingArgument(title, description, { usage, ephemeral = true } = {}) {
    return {
        ...(ephemeral ? privatePayload : payload)({
            tone: 'warning',
            kicker: 'Falta información',
            title,
            icon: '✍️',
            description,
            callouts: usage ? [{ tone: 'muted', text: `Uso: \`${usage}\`` }] : undefined,
        }),
    };
}

/** Cooldown activo. */
function cooldown(remainingMs, { name } = {}) {
    const seconds = (Math.max(0, remainingMs) / 1000).toFixed(1);
    return {
        ...privatePayload({
            tone: 'warning',
            kicker: 'Vas un poco rápido',
            title: name ? `\`${name}\` está en cooldown` : 'Cooldown',
            icon: '⏳',
            description: `Esperá **${seconds}s** antes de volver a usar este comando.`,
        }),
    };
}

/** Permisos insuficientes. Nunca revela el rol exacto: filtra info del servidor. */
function noPermission(description = 'Necesitás un permiso que no tenés en este servidor.', { required } = {}) {
    return privatePayload({
        tone: 'error',
        kicker: 'Permisos insuficientes',
        title: 'No puedo hacer eso acá',
        icon: '🔒',
        description,
        callouts: required ? [{ tone: 'muted', text: `Permiso requerido: \`${required}\`` }] : undefined,
    });
}

/** El bot no puede actuar (permiso suyo, no tuyo). */
function botMissingPermission(description = 'Me falta un permiso para poder hacer eso.', { required } = {}) {
    return privatePayload({
        tone: 'error',
        kicker: 'Falta un permiso mío',
        title: 'No puedo operar acá',
        icon: '🛠️',
        description,
        callouts: required ? [{ tone: 'muted', text: `Permiso que me falta: \`${required}\`` }] : undefined,
    });
}

/** Cargando (después de un defer). */
function loading(title = 'Un momento', description = 'Estoy trabajando en esto…', { tone = 'info' } = {}) {
    return payload({
        tone,
        kicker: 'Procesando',
        title,
        icon: '⏳',
        description,
    });
}

/** Respuesta positiva genérica (éxito sin datos que mostrar). */
function success(title, description, { hint, ephemeral = true, ...rest } = {}) {
    return {
        ...(ephemeral ? privatePayload : payload)({
            tone: 'success',
            kicker: 'Listo',
            title,
            icon: '✅',
            description,
            callouts: hint ? [{ tone: 'muted', text: hint }] : undefined,
            ...rest,
        }),
    };
}

/**
 * Panel informativo estándar (respuesta normal, no efímera).
 * Atajo para construir el panel común de un comando, con acento de categoría.
 */
function info(title, description, { category, tone, icon, kicker, ...rest } = {}) {
    return payload({ category, tone, title, icon, kicker, description, ...rest });
}

// Reexportamos utilidades de texto para que un comando no tenga que importar
// dos archivos para armar un panel.
module.exports = {
    error, internalError, empty, missingArgument, cooldown, noPermission,
    botMissingPermission, loading, success, info,
    // utilidades reexportadas
    pill: text.pillFromTheme, bullets: text.bullets, numbered: text.numbered,
    dataGrid: text.dataGrid, statCards: text.statCards, meter: text.meter,
    progressBar: text.progressBar, code: text.code, truncate: text.truncate,
    compact: text.compact, bytes: text.bytes, duration: text.duration,
    pluralize: text.pluralize, joinAnd: text.joinAnd, sparkline: text.sparkline,
    icons: theme.ICONS, pills: theme.PILLS, tones: theme.TONES,
};
