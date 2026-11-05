// src/lib/showcase.js
// Muestra en un panel los paneles de muestra del sistema de diseño.
//
// Sirve para dos cosas:
//   1. Ver de un vistazo cómo se ve cada bloque sin tener que.triggerar 20
//      comandos distintos.
//   2. Después de tocar el tema, comprobar que los colores y las cajas siguen
//      saliendo bien.
//
// Se invoca desde /showdesign (comando de owner) y desde `node scripts/` cuando
// se quiere una vista rápida en la terminal.

const ui = require('./ui');

/** Los bloques del sistema, con datos de ejemplo representativos. */
const SAMPLES = {
    info: {
        category: 'utilidad',
        kicker: 'Utilidad',
        title: 'Información del servidor',
        icon: '🌍',
        description: 'Así se ve un panel de datos: las cifras grandes arriba, el resto en una grilla alineada.',
        stats: [
            { label: 'Miembros', value: '1.284', icon: '👥' },
            { label: 'Canales', value: '51', icon: '💬' },
            { label: 'Roles', value: '24', icon: '🎭' },
            { label: 'Boosts', value: '14', icon: '🚀' },
            { label: 'Emojis', value: '87', icon: '😀' },
            { label: 'Uptime', value: '4d 3h', icon: '🕐' },
        ],
        grid: [
            ['Nombre', 'Deyraland'],
            ['ID', '118455556677889900'],
            ['Canales de texto', '42'],
            ['Canales de voz', '9 (2 escenarios)'],
            ['Verificación', 'Bajo'],
            ['Boost nivel', '2/3'],
        ],
        meters: [{ label: 'Nivel de boost', value: 2, max: 3, suffix: 'tier' }],
    },

    callouts: {
        category: 'moderación',
        kicker: 'Moderación',
        title: 'Estados de un aviso',
        icon: '⚠️',
        description: 'Cada tono lleva un símbolo además del color: se entiende igual en alto contraste.',
        callouts: [
            { tone: 'success', text: 'Acción completada correctamente.' },
            { tone: 'warning', text: 'Esta acción va a cerrar 15 mensajes.' },
            { tone: 'error', text: 'No tengo permiso para banear en este servidor.' },
            { tone: 'info', text: 'Los datos vienen de la API, pueden tardar unos segundos.' },
            { tone: 'muted', text: 'Este es un detalle secundario, para leer al final.' },
        ],
    },

    meters: {
        category: 'niveles',
        kicker: 'Progresión',
        title: 'Cuatro estilos de barra',
        icon: '📈',
        description: 'La barra muestra progreso, no un porcentaje: se lee sin calculadora.',
        meters: [
            { label: 'Bloques', value: 7, max: 10 },
            { label: 'Redondeado', value: 7, max: 10, style: 'rounded' },
            { label: 'Línea', value: 3, max: 10, style: 'line' },
            { label: 'Puntos', value: 9, max: 10, style: 'dots' },
        ],
        footerText: 'Cada estilo sirve para un contexto distinto: la línea para barras finas, los puntos para valores contados.',
    },

    image: {
        category: 'diversión',
        kicker: 'Galería de personajes',
        title: 'Waifu',
        icon: '🌸',
        caption: 'De la obra de **reuha_ルハ**.',
        media: { url: 'https://nekos.best/api/v2/waifu/e4c6c155-818d-4bc7-8339-01e81a90c86a.png' },
        source: 'nekos.best',
        sourceUrl: 'https://nekos.best',
        pagination: { page: 2, total: 10 },
    },

    lists: {
        category: 'utilidad',
        kicker: 'Listas',
        title: 'Bloques de contenido',
        icon: '📋',
        lists: [
            { title: 'Con viñetas', items: ['Primero', 'Segundo', 'Tercero'] },
            { title: 'Numerada', items: ['Paso uno', 'Paso dos'], ordered: true },
        ],
        quote: {
            text: 'La vida es bella.\nY también es corta, así que conviene no perderla viendo el celu.',
            author: 'Alguien',
            footer: 'Cita de ejemplo',
        },
    },

    social: {
        category: 'diversión',
        icon: '🤗',
        caption: '<@123456789012345678> abrazó a <@987654321098765432>\n\n-# <@123456789012345678> le ha hecho esto a Ryu **7** veces.',
        media: { url: 'https://nekos.best/api/v2/hug/b1136a84-2653-4c87-b80f-ea3cc0bf6abf.gif' },
        source: 'nekos.best',
    },

    error: {
        tone: 'error',
        kicker: 'Algo salió mal',
        title: 'No pude obtener la imagen',
        icon: '⚠️',
        description: 'Ninguna fuente respondió ahora mismo.',
        callouts: [{ tone: 'muted', text: 'Probá de nuevo en unos segundos.' }],
    },
};

/**
 * Devuelve el payload de una muestra.
 * @param {keyof typeof SAMPLES} name
 */
function sample(name) {
    const opts = SAMPLES[name];
    if (!opts) throw new Error(`Muestra desconocida: "${name}". Disponibles: ${Object.keys(SAMPLES).join(', ')}`);
    return ui.payload(opts);
}

/** Nombres de todas las muestras. */
function listSamples() {
    return Object.keys(SAMPLES);
}

module.exports = { sample, listSamples, SAMPLES };
