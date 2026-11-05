// src/lib/ui/theme.js
//
// Tokens de diseño de Deyra: la fuente única de verdad de color, iconografía y
// marca. Todo lo que se dibuja en un panel (título, acento, footer, íconos)
// sale de acá, así que cambiar la identidad visual del bot es editar este
// archivo y nada más.
//
// Idea central: una sola base de marca (azul acero, serio y legible) + un
// color de acento DISTINTO por categoría de comando. Cada bloque del bot
// se reconoce de un vistazo sin necesidad de leer el título, y el conjunto
// se ve coherente porque todos los acentos son de la misma familia
// (saturación media, luminosidad parecida, nada chillón).

const config = require('../../config');

// --- Marca ------------------------------------------------------------------

const BRAND = {
    name: config.BRAND?.name || config.BOT_NAME || 'Deyra',
    // Se muestra en el pie de cada panel. Vacío = solo "Deyra".
    tagline: config.BRAND?.tagline || '',
    inviteUrl: config.BRAND?.inviteUrl || '',
    supportUrl: config.BRAND?.supportUrl || '',
    docsUrl: config.BRAND?.docsUrl || '',
    get signature() {
        const parts = [this.tagline, this.inviteUrl].filter(Boolean);
        return parts.join(' · ');
    },
};

// --- Tonos semánticos -------------------------------------------------------
// Para el estado de la respuesta (no para el tema del comando).

const TONES = {
    primary: config.COLORS.PRIMARY,
    success: config.COLORS.SUCCESS,
    error: config.COLORS.ERROR,
    warning: config.COLORS.WARNING,
    neutral: config.COLORS.NEUTRAL,
    info: 0x5B8DEF,
    muted: 0x4A4E58,
};

/** Icono que acompaña al título cuando el comando no pasa uno propio. */
const TONE_ICONS = {
    primary: '◆',
    success: '✔',
    error: '✖',
    warning: '⚠',
    neutral: '●',
    info: 'ℹ',
    muted: '·',
};

// --- Acento por categoría ---------------------------------------------------
// El "color del bloque" del bot. Moderación, economía y niveles se distinguen
// entre sí sin leer nada; utilidad y configuración se mantienen sobrios.

const CATEGORIES = {
    'moderación': 0x4C6EF5,
    'tickets': 0x0CA678,
    'economía': 0xF59F00,
    'niveles': 0x2F9E44,
    'diversión': 0x7048E8,
    'música': 0xE64980,
    'utilidad': 0x1E3A5F,
    'configuración': 0x5C636A,
    'owner': 0xC2255C,
};

/** Etiqueta visible + ícono, para /help y para el encabezado de los paneles. */
const CATEGORY_LABELS = {
    'moderación': '🛡️ Moderación',
    'tickets': '🎫 Tickets',
    'economía': '💰 Economía',
    'niveles': '📈 Niveles',
    'diversión': '🎉 Diversión',
    'música': '🎵 Música',
    'utilidad': '🔧 Utilidad',
    'configuración': '⚙️ Configuración',
    'owner': '👑 Owner',
};

/** Etiquetas de la línea de contexto (kicker) que va arriba del título. */
const CATEGORY_KICKERS = {
    'moderación': 'Moderación',
    'tickets': 'Soporte',
    'economía': 'Economía',
    'niveles': 'Progresión',
    'diversión': 'Diversión',
    'música': 'Música',
    'utilidad': 'Utilidad',
    'configuración': 'Configuración',
    'owner': 'Owner',
};

// --- Escala tipográfica -----------------------------------------------------
// Niveles de encabezado de markdown. Ningún panel debería inventar su propio
// `##` o `###`: se pide por nombre y el tema decide el tamaño.

const TYPE = {
    display: '##',   // título principal del panel
    title: '###',     // subtítulo o nombre de sección grande
    heading: '####',  // encabezado de bloque
    eyebrow: '###',   // línea de contexto arriba de todo
    body: '',
    muted: '-#',
    code: '```',
};

// --- Setas de estado (pastillas) -------------------------------------------
// El color por sí solo no comunica: cada estado lleva SIEMPRE un símbolo y un
// texto, para que se entienda igual en modo de alto contraste.

const PILLS = {
    online: { icon: '🟢', label: 'Operativo' },
    degraded: { icon: '🟡', label: 'Degradado' },
    offline: { icon: '🔴', label: 'Caído' },
    idle: { icon: '⚪', label: 'Inactivo' },
    busy: { icon: '🟠', label: 'Ocupado' },
    success: { icon: '🟢', label: 'Correcto' },
    warning: { icon: '🟡', label: 'Atención' },
    danger: { icon: '🔴', label: 'Crítico' },
    locked: { icon: '🔒', label: 'Privado' },
    public: { icon: '🌐', label: 'Público' },
    info: { icon: '🔵', label: 'Info' },
    new: { icon: '🆕', label: 'Nuevo' },
    beta: { icon: '🧪', label: 'Beta' },
};

/** Iconos genéricos reutilizables (los emojis de app solo existen para algunos). */
const ICONS = {
    star: '⭐', sparkles: '✨', fire: '🔥', bolt: '⚡', heart: '❤️',
    chart: '📊', calendar: '📅', clock: '🕐', pin: '📌', link: '🔗',
    id: '🆔', user: '👤', users: '👥', crown: '👑', shield: '🛡️',
    bell: '🔔', flag: '🚩', gift: '🎁', trophy: '🏆', medal: '🥇',
    book: '📚', game: '🎮', music: '🎵', image: '🖼️', video: '🎬',
    globe: '🌍', money: '💰', ticket: '🎫', wrench: '🔧', robot: '🤖',
    bulb: '💡', warning: '⚠️', check: '✅', cross: '❌', eye: '👁️',
    mail: '📧', phone: '📱', key: '🔑', tag: '🏷️', archive: '🗄️',
    rocket: '🚀', party: '🎉', dice: '🎲', palette: '🎨', film: '🎞️',
};

/**
 * Resuelve el color de acento de un panel.
 * Prioridad: tono explícito > categoría > primario de marca.
 * @param {{tone?: string, category?: string}} opts
 * @returns {number} color entero para ContainerBuilder#setAccentColor
 */
function accentFor({ tone, category } = {}) {
    if (tone && TONES[tone] !== undefined) return TONES[tone];
    if (category && CATEGORIES[category] !== undefined) return CATEGORIES[category];
    return TONES.primary;
}

/**
 * Resuelve el ícono/etiqueta de eyebrow de un panel.
 * @param {{category?: string, eyebrow?: string}} opts
 */
function kickerFor({ category, eyebrow } = {}) {
    if (eyebrow) return eyebrow;
    if (category && CATEGORY_KICKERS[category]) return CATEGORY_KICKERS[category];
    return null;
}

/** Color de acento con fallback seguro si el tono no existe. */
function toneColor(tone) {
    return TONES[tone] ?? TONES.primary;
}

/** Convierte un entero de color a string hex `#RRGGBB` (para logs/texto plano). */
function hex(color) {
    return `#${(color >>> 0).toString(16).padStart(6, '0').toUpperCase()}`;
}

module.exports = {
    BRAND, TONES, TONE_ICONS, CATEGORIES, CATEGORY_LABELS, CATEGORY_KICKERS,
    TYPE, PILLS, ICONS, accentFor, kickerFor, toneColor, hex,
};
