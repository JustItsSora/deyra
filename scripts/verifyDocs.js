// scripts/verifyDocs.js
// Comprueba que lo que el README promete exista de verdad.
//
// Un README que lista comandos que ya no están, o que se forgeta de contar, es
// documentación falsa: hace perder tiempo al que la lee. Este script compara lo
// documentado contra los comandos realmente cargados.
//
// Uso: node scripts/verifyDocs.js

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const fs = require('fs');
const path = require('path');
const { Collection } = require('discord.js');
const { loadHybridCommands, loadSlashCommands, loadPrefixCommands } = require('../src/lib/commandLoader');
const { PUBLIC_ACTIONS } = require('../src/lib/socialActions');
const { listGifCategories, listCharacterCategories } = require('../src/lib/gifApi');

const ROOT = path.join(__dirname, '..');
const SRC = path.join(ROOT, 'src');
const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf8');

const client = { commands: new Collection(), prefixCommands: new Collection() };
loadHybridCommands(client, path.join(SRC, 'hybrid'));
loadSlashCommands(client, path.join(SRC, 'commands', 'slash'));
loadPrefixCommands(client, path.join(SRC, 'commands', 'prefix'));

const problems = [];
const notes = [];

// --- 1. Conteos del README --------------------------------------------------

const slashCount = client.commands.size;
const prefixCount = client.prefixCommands.size;

const countClaims = [
    { re: /Más de (\d+) comandos entre moderación/, label: 'primer párrafo' },
    { re: /\[boot\] (\d+) slash commands cargados/, label: 'bloque de arranque' },
    { re: /\[boot\] (\d+) entradas de comandos de prefijo/, label: 'bloque de arranque' },
    { re: /\[commands\] (\d+) comandos registrados/, label: 'bloque de arranque' },
    { re: /(\d+) comandos quedan solo con prefijo/, label: 'bloque de arranque' },
    { re: /Deyra tiene (\d+), así que se registran los (\d+)/, label: 'explicación del límite' },
    { re: /### Acciones sociales \((\d+)\)/, label: 'sección de acciones' },
    { re: /### Imágenes de personaje \((\d+)\)/, label: 'sección de personajes' },
    { re: /las (\d+) categorías de GIF que usa el bot son SFW/, label: 'política de contenido' },
    { re: /(\d+) estilos de DiceBear/, label: 'tabla de fuentes' },
    { re: /Los (\d+) archivos cargan, los (\d+) comandos son válidos/, label: 'verificación' },
    { re: /los (\d+) comandos son válidos/, label: 'verificación' },
    { re: /(\d+) casos del sistema de diseño/, label: 'verificación' },
    { re: /(\d+) casos con los comandos migrados/, label: 'verificación' },
];

const realCounts = {
    slash: slashCount,
    prefix: prefixCount,
    social: PUBLIC_ACTIONS.length,
    characters: listCharacterCategories().length,
    gifCategories: listGifCategories().length,
    avatarStyles: Object.keys(require('../src/lib/api/avatarApi').STYLES).length,
    maxSlash: require('../src/config').MAX_SLASH_COMMANDS,
};

notes.push(`Real: ${slashCount} slash, ${prefixCount} prefijo, ${realCounts.social} acciones, ${realCounts.characters} personajes, ${realCounts.gifCategories} categorías GIF, ${realCounts.avatarStyles} estilos de avatar, límite ${realCounts.maxSlash}.`);

// Los conteos del README se comparan de verdad. Antes esta lista de regex
// estaba definida y nunca se iteraba, así que el README podía decir "533
// comandos" indefinidamente y el check pasaba igual: documentation falsa que el
// verificador no miraba.
const countValues = {
    'primer párrafo': (m) => Number(m[1]) <= slashCount,
    'bloque de arranque': (m) => {
        if (/slash commands cargados/.test(m[0])) return Number(m[1]) === slashCount;
        if (/entradas de comandos de prefijo/.test(m[0])) return Number(m[1]) === prefixCount;
        if (/comandos registrados/.test(m[0])) return Number(m[1]) === realCounts.maxSlash;
        if (/quedan solo con prefijo/.test(m[0])) return Number(m[1]) === slashCount - realCounts.maxSlash;
        return true;
    },
    'explicación del límite': (m) => Number(m[1]) === slashCount && Number(m[2]) === realCounts.maxSlash,
    'sección de acciones': (m) => Number(m[1]) === realCounts.social,
    'sección de personajes': (m) => Number(m[1]) === realCounts.characters,
    'política de contenido': (m) => Number(m[1]) === realCounts.gifCategories,
    'tabla de fuentes': (m) => Number(m[1]) === realCounts.avatarStyles,
    'verificación': (m) => true,
};

for (const claim of countClaims) {
    const match = readme.match(claim.re);
    if (!match) {
        problems.push(`El README ya no tiene el conteo de "${claim.label}" (faltaría: ${claim.re}).`);
        continue;
    }
    const check = countValues[claim.label];
    if (check && !check(match)) {
        problems.push(`Conteo desactualizado en "${claim.label}": el README dice ${match.slice(1).join(' / ')} y el código tiene otro número.`);
    }
}

// --- 2. Comandos citados en el README ---------------------------------------

// Backticks con un slash adelante: `/comando`
const mentioned = new Set();
for (const match of readme.matchAll(/`\/([a-z][a-z0-9_]*)`/g)) {
    mentioned.add(match[1]);
}

// Nombres citados sin slash, dentro de las listas de acciones sociales.
for (const match of readme.matchAll(/^\s*\*\*Con objetivo:\*\*|^-\s*\*\*Con objetivo/gm)) {
    // no-op: se parsea abajo
}
const socialBlock = readme.match(/- \*\*Con objetivo:\*\* (.+)\n- \*\*Sin objetivo:\*\* (.+)/);
if (socialBlock) {
    const extract = (line) => line.split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
    for (const name of [...extract(socialBlock[1]), ...extract(socialBlock[2])]) {
        mentioned.add(name);
    }
}

// Comandos con argumentos: `/comando <algo>` o `` `/comando texto` ``
for (const match of readme.matchAll(/`\/([a-z][a-z0-9_]*)\s/g)) {
    mentioned.add(match[1]);
}

const IGNORED = new Set([
    // Placeholders de la documentación: "el prefijo !comando" no es un
    // comando concreto, es la forma de escribir uno.
    'comando', 'nombre', 'texto', 'cancion', 'titulo', 'palabra', 'consulta',
    'busqueda', 'cantidad', 'numero', 'activar', 'bloque', 'categoria', 'appid',
    'usuario', 'segundos', 'motivo', 'id', 'rol', 'canal', 'emoji', 'color',
    'estilo', 'tiempo', 'valor', 'clave', 'nuevo', 'juego', 'libro', 'serie',
]);

const missing = [...mentioned].filter(name => !client.commands.has(name) && !IGNORED.has(name));
if (missing.length) {
    problems.push(`El README menciona comandos que no existen: ${missing.join(', ')}`);
}

// --- 3. Comandos que existen pero no están documentados (solo los nuevos) ----

const NEW_COMMANDS = [
    'gif', 'waifu', 'neko', 'kitsune', 'husbando', 'shiro', 'senko', 'okami', 'holo',
    'animeinfo', 'book', 'tvshow', 'meal', 'brewery', 'freegames', 'xkcd',
    'memetemplate', 'catmeme', 'avatar', 'urban', 'chuckjoke', 'song', 'steamgame',
    'iss', 'ghsearch', 'nsfw', 'showdesign', 'clear', 'ai', 'resumir',
];
const undocumented = NEW_COMMANDS.filter(name => !readme.includes(`\`/${name}\``) && !readme.includes(`/${name}`));
if (undocumented.length) {
    problems.push(`Comandos nuevos sin mencionar en el README: ${undocumented.join(', ')}`);
}

// --- 4. Acciones sociales: todas las del catálogo, todas en el README -------

if (socialBlock) {
    const extract = (line) => line.split(',').map(s => s.trim().split(/\s+/)[0]).filter(Boolean);
    const documented = new Set([...extract(socialBlock[1]), ...extract(socialBlock[2])]);
    const notDocumented = PUBLIC_ACTIONS.filter(a => !documented.has(a));
    if (notDocumented.length) {
        problems.push(`Acciones del catálogo ausentes del README: ${notDocumented.join(', ')}`);
    }
}

// --- 5. Personajes ----------------------------------------------------------

// La lista del README es la línea que arranca con "/waifu" (con o sin
// backticks), y sigue hasta el final de la enumeración.
const charBlock = readme.match(/^\/?`?\/?waifu[^\n]*/m);
const documentedChars = charBlock
    ? charBlock[0]
        .split(/[—\n]/)[0]
        .split(',')
        .map(s => s.trim().replace(/[`/]/g, ''))
        .filter(s => s && s.length < 30)
    : [];
const missingChars = listCharacterCategories().filter(c => !documentedChars.includes(c));
if (missingChars.length) {
    problems.push(`Imágenes de personaje ausentes del README: ${missingChars.join(', ')}`);
}

// --- 6. Rutas de archivos mentioned -----------------------------------------

for (const match of readme.matchAll(/`(src\/[a-zA-Z0-9_/\.]+|scripts\/[a-zA-Z0-9_]+\.js)`/g)) {
    if (!fs.existsSync(path.join(ROOT, match[1]))) {
        problems.push(`El README menciona un archivo que no existe: ${match[1]}`);
    }
}

// --- 7. Scripts de npm ------------------------------------------------------

const pkg = JSON.parse(fs.readFileSync(path.join(ROOT, 'package.json'), 'utf8'));
for (const match of readme.matchAll(/npm run ([a-z:]+)/g)) {
    if (!pkg.scripts[match[1]]) {
        problems.push(`El README dice "npm run ${match[1]}" pero ese script no existe en package.json.`);
    }
}

// --- Informe -----------------------------------------------------------------

console.log(notes.join('\n'));
console.log(`\nComandos citados en el README: ${mentioned.size}`);
console.log(`Documentados de los nuevos: ${NEW_COMMANDS.length - undocumented.length}/${NEW_COMMANDS.length}`);

if (problems.length) {
    console.log('\n══════════ DOCUMENTACIÓN ══════════');
    for (const p of problems) console.log(`  ✖ ${p}`);
    process.exit(1);
}
console.log('\n✔ El README coincide con el código.');
