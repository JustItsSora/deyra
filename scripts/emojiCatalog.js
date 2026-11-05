// scripts/emojiCatalog.js
//
// Fuente única de verdad de qué assets locales se suben como Application Emojis
// (emojis propios del bot, utilizables en cualquier servidor donde esté, sin
// necesidad de que ese servidor tenga slots de emoji libres).
//
// Cada entrada:
//   file     -> ruta relativa a assets/emojis/
//   name     -> nombre final del emoji en Discord (a-z, 0-9, _ ; máx 32 chars)
//   key      -> clave interna que usará el resto del código (src/lib/emojis.js)
//   animated -> true si es .gif
//
// Para añadir un pack nuevo: descomprímelo en assets/emojis/<pack>/ y agrega
// sus entradas aquí. El nombre del archivo de origen (p.ej. "255998-ac.png")
// no importa para Discord — solo lo usamos para localizar el archivo.

const path = require('path');

const ASSETS_DIR = path.join(__dirname, '..', 'assets', 'emojis');

const CATALOG = [
    // ---------- Pack: blueicons (utilidad / moderación / estado) ----------
    { file: 'blueicons/340698-yes.png', name: 'blue_yes', key: 'YES', animated: false },
    { file: 'blueicons/207084-no.png', name: 'blue_no', key: 'NO', animated: false },
    { file: 'blueicons/637215-no.png', name: 'blue_deny', key: 'DENY', animated: false },
    { file: 'blueicons/998200-shield.png', name: 'blue_shield', key: 'SHIELD', animated: false },
    { file: 'blueicons/329572-ban.png', name: 'blue_ban', key: 'BAN', animated: false },
    { file: 'blueicons/182447-lock.png', name: 'blue_lock', key: 'LOCK', animated: false },
    { file: 'blueicons/276530-crown.png', name: 'blue_crown', key: 'CROWN', animated: false },
    { file: 'blueicons/197546-clock.png', name: 'blue_clock', key: 'CLOCK', animated: false },
    { file: 'blueicons/716587-pin.png', name: 'blue_pin', key: 'PIN', animated: false },
    { file: 'blueicons/946480-eye.png', name: 'blue_eye', key: 'EYE', animated: false },
    { file: 'blueicons/830561-support.png', name: 'blue_support', key: 'SUPPORT', animated: false },
    { file: 'blueicons/600404-handshake.png', name: 'blue_handshake', key: 'HANDSHAKE', animated: false },
    { file: 'blueicons/530749-calendar.png', name: 'blue_calendar', key: 'CALENDAR', animated: false },
    { file: 'blueicons/397842-bug.png', name: 'blue_bug', key: 'BUG', animated: false },
    { file: 'blueicons/646384-triangle.png', name: 'blue_warning', key: 'WARNING', animated: false },
    { file: 'blueicons/865892-vpn.png', name: 'blue_vpn', key: 'VPN', animated: false },
    { file: 'blueicons/567464-angry.png', name: 'blue_angry', key: 'ANGRY', animated: false },
    { file: 'blueicons/946710-wave.png', name: 'blue_wave', key: 'WAVE', animated: false },
    { file: 'blueicons/960664-clash.png', name: 'blue_clash', key: 'CLASH', animated: false },
    { file: 'blueicons/696872-description.png', name: 'blue_description', key: 'DESCRIPTION', animated: false },
    { file: 'blueicons/95178-camera.png', name: 'blue_camera', key: 'CAMERA', animated: false },
    { file: 'blueicons/160505-heath.png', name: 'blue_health', key: 'HEALTH', animated: false },
    { file: 'blueicons/255998-ac.png', name: 'blue_ac', key: 'AC', animated: false },

    // ---------- Pack: ticks (confirmación / estado, estático + animado) ----------
    { file: 'ticks/495202-green-tick.png', name: 'tick_green', key: 'TICK_GREEN', animated: false },
    { file: 'ticks/814373-red-tick.png', name: 'tick_red', key: 'TICK_RED', animated: false },
    { file: 'ticks/684537-grey-tick.png', name: 'tick_grey', key: 'TICK_GREY', animated: false },
    { file: 'ticks/9887-green-tick.gif', name: 'tick_green_a', key: 'TICK_GREEN_ANIMATED', animated: true },
    { file: 'ticks/2413-red-tick.gif', name: 'tick_red_a', key: 'TICK_RED_ANIMATED', animated: true },
    { file: 'ticks/1162-grey-tick.gif', name: 'tick_grey_a', key: 'TICK_GREY_ANIMATED', animated: true },
];

module.exports = { CATALOG, ASSETS_DIR };
