// scripts/renderPreview.js
// Vuelca los paneles del sistema de diseño a texto plano, para revisarlos en la
// terminal sin un cliente de Discord.
//
// Sirve sobre todo después de tocar el tema: se ven al instante los problemas de
// alineación, los cortes de línea raros y los bloques que quedaron vacíos.
//
// Uso:
//   node scripts/renderPreview.js              # todas las muestras
//   node scripts/renderPreview.js info meters  # solo algunas
//   node scripts/renderPreview.js --theme      # los colores por categoría

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const showcase = require('../src/lib/showcase');
const theme = require('../src/lib/ui/theme');
const ui = require('../src/lib/ui');

const T = { ActionRow: 1, Section: 9, TextDisplay: 10, Thumbnail: 11, MediaGallery: 12, File: 13, Separator: 14, Container: 17 };

// --- Color en la terminal ---------------------------------------------------
const useColor = process.stdout.isTTY && !process.env.NO_COLOR;
const fg = (hex, str) => (useColor ? `\x1b[38;2;${(hex >> 16) & 255};${(hex >> 8) & 255};${hex & 255}m${str}\x1b[0m` : str);
const dim = (str) => (useColor ? `\x1b[2m${str}\x1b[0m` : str);
const bold = (str) => (useColor ? `\x1b[1m${str}\x1b[0m` : str);

const LINE = '─'.repeat(64);

function heading(text) {
    const left = `── ${text} `;
    console.log(`\n${fg(0x1E3A5F, left + '─'.repeat(Math.max(0, LINE.length - left.length)))}`);
}

/** Un TextDisplay, con el markdown acentuado para que se lea el peso visual. */
let inCode = false;

function renderText(content, color) {
    const lines = String(content).split('\n');

    for (const line of lines) {
        // Un bloque de código tiene su propia pasada: sin esto se perdería la
        // alineación, que es justo lo que hay que revisar.
        if (line.startsWith('```')) {
            if (line.trim() === '```') {
                inCode = !inCode;
            }
            continue;
        }
        if (inCode) {
            console.log(`  ${line}`);
            continue;
        }
        if (line.startsWith('-#')) {
            console.log(dim(`  ${line.slice(3)}`));
            continue;
        }
        if (line.startsWith('>')) {
            console.log(fg(color, `  ${line}`));
            continue;
        }
        if (line.startsWith('#')) {
            console.log(bold(fg(color, `  ${line}`)));
            continue;
        }
        if (line.trim() === '') continue;
        console.log(`  ${line}`);
    }
}

/** Volca un payload { components, flags } en texto plano. */
function render(payload, { accent } = {}) {
    const color = accent ?? payload.components[0]?.toJSON()?.accent_color ?? 0x1E3A5F;

    for (const container of payload.components) {
        const json = typeof container.toJSON === 'function' ? container.toJSON() : container;
        const bar = fg(color, `▌${'─'.repeat(LINE.length - 1)}`);

        for (const child of json.components) {
            switch (child.type) {
            case T.TextDisplay:
                renderText(child.content, color);
                break;
            case T.MediaGallery:
                console.log(dim(`  [galería: ${child.items.length} imagen${child.items.length === 1 ? '' : 'es'}]`));
                for (const item of child.items) {
                    const url = item?.media?.url || '?';
                    console.log(dim(`    ${item.spoiler ? '🔒 ' : ''}${url.length > 58 ? `${url.slice(0, 55)}…` : url}`));
                }
                break;
            case T.ActionRow:
                console.log(`  ${child.components.map(b => `[${b.label || b.custom_id || '?'}]`).join(' ')}`);
                break;
            case T.Section: {
                const text = (child.components || []).map(c => c.content).join(' ');
                const acc = child.accessory;
                const accLabel = acc?.media?.url
                    ? '⟵ miniatura'
                    : (acc?.label ? `⟵ [${acc.label}]` : '');
                console.log(bar);
                renderText(text, color);
                if (accLabel) console.log(dim(`  ${accLabel}`));
                break;
            }
            case T.Separator:
                console.log(dim(`  ${child.divider ? '─'.repeat(6) : '·'.repeat(6)}`));
                break;
            case T.File:
                console.log(dim(`  [archivo: ${child.file?.url || '?'}]`));
                break;
            default:
                console.log(dim(`  [tipo ${child.type}]`));
            }
        }
        console.log(bar);
    }
}

function showTheme() {
    heading('Colores por categoría');
    for (const [cat, color] of Object.entries(theme.CATEGORIES)) {
        console.log(`  ${fg(color, '████████')}  ${theme.HEX ? theme.HEX(color) : ''}  ${cat.padEnd(16)} ${theme.CATEGORY_LABELS[cat] || ''}`);
    }

    heading('Tonos semánticos');
    for (const [name, color] of Object.entries(theme.TONES)) {
        const icon = theme.TONE_ICONS[name] || '·';
        console.log(`  ${fg(color, '████████')}  ${icon} ${name}`);
    }

    heading('Pastillas de estado');
    for (const [name, pill] of Object.entries(theme.PILLS)) {
        console.log(`  ${pill.icon} ${pill.label.padEnd(14)} (${name})`);
    }
}

function showPalette() {
    heading('Primitivas de texto');
    console.log('  Grilla:');
    console.log(ui.dataGrid([['Nombre', 'Deyraland'], ['ID', '118455556677889900'], ['Emojis', '1.204 🎉'], ['Chino', '中文测试']]));
    console.log('\n  Tarjetas:');
    console.log(ui.statCards([
        { label: 'Comandos', value: '542', icon: '⚡' },
        { label: 'Servidores', value: '37', icon: '🌍' },
        { label: 'Uptime', value: '4d 3h', icon: '🕐' },
    ]));
    console.log('\n  Medidores:');
    console.log(ui.meter([
        { label: 'XP', value: 7, max: 10 },
        { label: 'Boost', value: 2, max: 3, suffix: 'tier', style: 'rounded' },
        { label: 'Caché', value: 1, max: 10, style: 'dots' },
    ]));
    console.log('\n  Sparkline:');
    console.log(`  ${ui.sparkline([3, 7, 2, 9, 4, 8, 1, 6, 5])}`);
    console.log(`\n  Formato: ${ui.compact(1234567)} · ${ui.bytes(1536000)} · ${ui.duration(93784000)} · ${ui.pluralize(3, 'vez', 'veces')}`);
}

const args = process.argv.slice(2);

if (args.includes('--theme')) {
    showTheme();
} else if (args.includes('--palette')) {
    showPalette();
} else {
    const requested = args.filter(a => !a.startsWith('--'));
    const names = requested.length ? requested : showcase.listSamples();

    for (const name of names) {
        try {
            heading(name);
            inCode = false;
            render(showcase.sample(name));
        } catch (err) {
            console.log(`  \x1b[31m✖ ${err.message}\x1b[0m`);
        }
    }
}
