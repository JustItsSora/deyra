// scripts/verifyUi.js
// Verificación local del sistema de diseño: arma paneles de todos los tipos y
// valida que el JSON que sale sea EXACTAMENTE lo que Discord acepta.
// No necesita token ni conexión.
//
// Uso: node scripts/verifyUi.js

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const ui = require('../src/lib/ui');
const { panel, panelPayload, successPanel, errorPanel, infoPanel, warningPanel, buildPanel } = require('../src/lib/panel');

let pass = 0;
let fail = 0;
const problems = [];

// Tipos reales de Components V2 (discord-api-types v10):
// ActionRow 1 · Section 9 · TextDisplay 10 · Thumbnail 11 · MediaGallery 12
// File 13 · Separator 14 · Container 17
const T = { ActionRow: 1, Section: 9, TextDisplay: 10, Thumbnail: 11, MediaGallery: 12, File: 13, Separator: 14, Container: 17 };

/** Valida la estructura del JSON de un Container contra las reglas de Discord. */
function validateContainer(json, where) {
    if (json.type !== T.Container) { problems.push(`${where}: no es Container (type ${json.type})`); return; }
    if (json.components.length > 10) {
        problems.push(`${where}: ${json.components.length} hijos (>10, Discord lo rechaza)`);
    }
    for (const child of json.components) {
        if (child.type === T.Container) {
            if (child.components.length > 10) problems.push(`${where}: container anidado con ${child.components.length} hijos`);
            continue;
        }
        if (child.type === T.TextDisplay) {
            if (child.content.length > 4000) problems.push(`${where}: TextDisplay de ${child.content.length} chars (>4000)`);
            continue;
        }
        if (child.type === T.MediaGallery) {
            if (child.items.length > 10) problems.push(`${where}: galería de ${child.items.length} (>10)`);
            for (const item of child.items) {
                // El item serializa como { media: { url }, description, spoiler }
                const url = item?.media?.url;
                if (!url || !/^https?:\/\//.test(url)) problems.push(`${where}: URL inválida "${url}"`);
            }
            continue;
        }
        if (child.type === T.ActionRow) {
            if (child.components.length > 5) problems.push(`${where}: fila con ${child.components.length} botones (>5)`);
            continue;
        }
        if (child.type === T.Section) {
            if (!child.accessory) problems.push(`${where}: section sin accesorio`);
            continue;
        }
        if (child.type === T.Separator) continue;
        problems.push(`${where}: tipo de componente inesperado ${child.type}`);
    }
}

function check(name, builder) {
    try {
        const payload = builder();
        if (!payload || !Array.isArray(payload.components) || payload.components.length === 0) {
            problems.push(`${name}: payload sin components`);
            fail++;
            return payload;
        }
        if (payload.components.length > 40) problems.push(`${name}: ${payload.components.length} containers (>40)`);
        for (const c of payload.components) validateContainer(c.toJSON(), name);
        if ((payload.flags & 32768) === 0) problems.push(`${name}: falta el flag IsComponentsV2`);
        if (payload.content) problems.push(`${name}: usa content junto a ComponentsV2 (Discord lo rechaza)`);
        pass++;
    } catch (err) {
        problems.push(`${name}: lanzó ${err.message}`);
        fail++;
    }
    return null;
}

const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId('a').setLabel('Aceptar').setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId('b').setLabel('Rechazar').setStyle(ButtonStyle.Danger),
);
const manyRows = [0, 1, 2].map(i => new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`x${i}`).setLabel(`B${i}`).setStyle(ButtonStyle.Secondary),
));

// --- Casos del puente de compatibilidad (los que usan los 475 comandos) ---
check('buildPanel simple', () => ({ components: [buildPanel({ title: 'Hola', description: 'Mundo' })], flags: 32768 }));
check('buildPanel con líneas', () => ({ components: [buildPanel({ title: 'Info', lines: ['a', 'b', 'c'] })], flags: 32768 }));
check('buildPanel con rows', () => ({ components: [buildPanel({ title: 'Poll', description: 'x', rows: [row] })], flags: 32768 }));
check('buildPanel 3 rows', () => ({ components: [buildPanel({ title: 'Tic', rows: manyRows })], flags: 32768 }));
check('buildPanel categoría', () => ({ components: [buildPanel({ title: 'x', category: 'economía' })], flags: 32768 }));
check('successPanel posicional', () => successPanel('Listo', 'desc'));
check('errorPanel posicional', () => errorPanel('Error', 'desc'));
check('infoPanel posicional', () => infoPanel('Info', 'desc'));
check('warningPanel posicional', () => warningPanel('Ojo', 'desc'));
check('successPanel objeto', () => successPanel({ title: 'T', description: 'D', lines: ['x'], rows: [row] }));
check('errorPanel con hint', () => errorPanel('E', 'D', { hint: 'probá otra vez' }));

// --- Casos del sistema nuevo ---
check('grid', () => panelPayload({ title: 'Clima', category: 'utilidad', grid: [['Condición', 'Despejado'], ['Temp', '21'], ['Humedad', '60%']] }));
check('grid estilo leader', () => panelPayload({ title: 'Server', category: 'utilidad', gridOptions: { style: 'leader' }, grid: [['Nombre', 'Deyraland'], ['ID', '123'], ['Miembros', '1284']] }));
check('stats', () => panelPayload({ title: 'Métricas', category: 'diversión', stats: [{ label: 'Comandos', value: '542', icon: '⚡' }, { label: 'Servidores', value: '37', icon: '🌍' }, { label: 'Uptime', value: '4d 3h', icon: '🕐' }] }));
check('meters', () => panelPayload({ title: 'Nivel', category: 'niveles', meters: [{ label: 'XP', value: 340, max: 500 }, { label: 'Rank', value: 3, max: 20 }] }));
check('media + caption', () => ui.imagePayload({ title: 'Gato', icon: '🐱', caption: 'Un gato.', url: 'https://example.com/a.jpg', source: 'test', sourceUrl: 'https://example.com' }));
check('media galería 10', () => ui.imagePayload({ title: 'Galería', urls: Array.from({ length: 10 }, (_, i) => `https://example.com/${i}.jpg`), pagination: { page: 1, total: 3 }, rows: [row] }));
check('media galería 25 (se parte)', () => ui.imagePayload({ title: 'Galería', urls: Array.from({ length: 25 }, (_, i) => `https://example.com/${i}.jpg`) }));
check('spoiler', () => ui.imagePayload({ title: 'X', url: 'https://example.com/a.jpg', spoiler: 'true' }));
check('callouts', () => panelPayload({ title: 'Aviso', category: 'moderación', callouts: [{ tone: 'warning', text: 'Cuidado' }, { tone: 'muted', text: 'Nota menor' }] }));
check('lists', () => panelPayload({ title: 'Lista', lists: [{ title: 'Top', items: ['a', 'b', 'c'] }, { title: 'Otros', items: ['d'], ordered: true }] }));
check('quote', () => panelPayload({ title: 'Cita', quote: { text: 'La vida es bella.', author: 'Alguien', footer: 'Película' } }));
check('section con botón', () => panelPayload({ title: 'Sección', sections: [ui.section({ text: 'Texto al lado del botón', accessory: new ButtonBuilder().setLabel('Ir').setStyle(ButtonStyle.Link).setURL('https://discord.com') })] }));
check('section con miniatura', () => panelPayload({ title: 'Sección', sections: [ui.section({ text: 'Con miniatura', accessory: { url: 'https://example.com/t.png', description: 'thumb' } })] }));

// --- Casos límite (los que antes rompían el mensaje) ---
check('texto gigante', () => panelPayload({ title: 'Largo', description: 'a'.repeat(9000) }));
check('50 líneas', () => panelPayload({ title: 'Muchas líneas', fields: Array.from({ length: 50 }, (_, i) => `línea ${i}`) }));
check('20 listas', () => panelPayload({ title: 'Sobrecarga', lists: Array.from({ length: 20 }, (_, i) => ({ title: `L${i}`, items: ['a', 'b'] })) }));
check('6 stats + 6 listas + media + 3 rows', () => panelPayload({
    title: 'Estres', category: 'diversión',
    stats: Array.from({ length: 6 }, (_, i) => ({ label: `M${i}`, value: `${i * 100}` })),
    lists: Array.from({ length: 6 }, (_, i) => ({ title: `L${i}`, items: ['a', 'b', 'c'] })),
    media: 'https://example.com/a.jpg',
    rows: manyRows,
    description: 'x'.repeat(3000),
}));
check('markdown roto a propósito', () => panelPayload({ title: 'Corte', description: '**negrita sin cerrar y `código sin cerrar '.repeat(40) }));
check('ancho/emoji CJK', () => panelPayload({ title: '数据', grid: [['名前', 'テスト'], ['Emoji', '🎉🎊✨'], ['Largo', 'x'.repeat(60)]] }));
check('grid vacío', () => panelPayload({ title: 'Vacío', grid: [] }));
check('sin nada', () => panelPayload({}));
check('solo título', () => panelPayload({ title: 'Solo' }));
check('private/ephemeral', () => ui.error('E', 'D', { ephemeral: true }));
check('cooldown state', () => ui.cooldown(3200, { name: 'ping' }));
check('no permission', () => ui.noPermission('no podés', { required: 'BanMembers' }));
check('loading', () => ui.loading());
check('empty', () => ui.empty('Nada', 'No hay resultados', { hint: 'probá otra cosa' }));
check('internalError', () => ui.internalError(new Error('boom'), { context: 'test' }));
check('dataGrid directo', () => ({ components: [ui.buildOne({ title: 'DG', fields: [ui.dataGrid([['a', '1'], ['bb', '22']])], brand: false })], flags: 32768 }));
check('statCards directo', () => ({ components: [ui.buildOne({ title: 'SC', fields: [ui.statCards([{ label: 'A', value: '1' }, { label: 'B', value: '2' }, { label: 'C', value: '3' }])], brand: false })], flags: 32768 }));
check('sparkline', () => ({ components: [ui.buildOne({ title: 'Spark', fields: [ui.code(ui.sparkline([1, 5, 3, 9, 2, 7, 4]))], brand: false })], flags: 32768 }));

// --- Salida de muestra para inspección visual ---
console.log('\n===== MUESTRA: panel de info con grilla + tarjetas =====');
const sample = panel({
    category: 'utilidad', kicker: 'Utilidad', title: 'Información del servidor',
    icon: '🌍',
    grid: [['Nombre', 'Deyraland'], ['ID', '1184...'], ['Dueño', 'Ryu#0001'], ['Creado', 'hace 2 años'], ['Miembros', '1.284']],
    stats: [{ label: 'Canales', value: '42', icon: '💬' }, { label: 'Voz', value: '9', icon: '🔊' }, { label: 'Boosts', value: '14', icon: '🚀' }],
    meters: [{ label: 'Nivel del boost', value: 3, max: 3, suffix: 'tier' }],
    lists: [{ title: 'Destacados', items: ['Canal #general', 'Rol @staff'] }],
});
console.log(JSON.stringify(sample.toJSON(), null, 1).slice(0, 2600));

console.log('\n===== MUESTRA: grilla alineada =====');
console.log(ui.dataGrid([
    ['Nombre', 'Deyraland'], ['ID', '118455556677889900'],
    ['Canales de texto', '42'], ['Canales de voz', '9'],
    ['Emojis', '1.204 🎉'],
], { style: 'plain' }));
console.log('\n===== MUESTRA: tarjetas =====');
console.log(ui.statCards([
    { label: 'Comandos', value: '542', icon: '⚡' },
    { label: 'Servidores', value: '37', icon: '🌍' },
    { label: 'Uptime', value: '4d 3h', icon: '🕐' },
]));
console.log('\n===== MUESTRA: medidor =====');
console.log(ui.meter([
    { label: 'XP al nivel 5', value: 340, max: 500 },
    { label: 'Progreso del día', value: 42, max: 60, style: 'rounded' },
]));

console.log(`\n===== RESULTADO: ${pass} OK / ${fail} con error =====`);
if (problems.length) {
    console.log('Problemas detectados:');
    for (const p of problems) console.log(`  ✖ ${p}`);
    process.exit(1);
}
console.log('Todos los paneles cumplen los límites de Discord.');
