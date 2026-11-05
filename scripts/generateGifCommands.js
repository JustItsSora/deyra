// scripts/generateGifCommands.js
// Genera los comandos sociales uno-varios (/slap, /hug, /bonk, ...) a partir de
// dos catálogos:
//
//   · src/lib/socialActions.js  → qué hace cada acción y cómo se lee
//   · src/lib/gifApi.js         → qué categoría de GIF real usa cada una
//
// Por qué generarlos: el commandLoader de Deyra escanea carpetas del disco y el
// registro de slash commands necesita un SlashCommandBuilder por comando. Agregar
// una acción nueva es entonces: 1) una línea en socialActions.js, 2) correr este
// script. Cero archivos escritos a mano.
//
// Es idempotente y NO pisa los comandos que alguien escribió a mano (los que no
// tienen el sello del generador), salvo que se pase --force.
//
// Uso:
//   node scripts/generateGifCommands.js            # crea los que faltan
//   node scripts/generateGifCommands.js --dry-run  # muestra qué haría
//   node scripts/generateGifCommands.js --force    # regenera todo

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const { SOCIAL_ACTIONS, SOLO_PHRASES, SELF_ALLOWED, PUBLIC_ACTIONS } = require('../src/lib/socialActions');
const { GIF_CATEGORIES, EXTRA_CATEGORIES, CHARACTER_CATEGORIES, hasCategory, DISPLAY_NAMES } = require('../src/lib/gifApi');

const HYBRID_DIR = path.join(__dirname, '..', 'src', 'hybrid');
const force = process.argv.includes('--force');
const dryRun = process.argv.includes('--dry-run');
const only = process.argv.find(a => a.startsWith('--only='))?.split('=')[1];

/** Los límites de Discord para nombres de slash command. */
const MAX_NAME = 32;
const RESERVED = new Set(['help', 'invite']);

/** Nombre de comando válido: minúsculas, sin acentos, sin repetir. */
function toCommandName(key) {
    const base = key
        .normalize('NFD')
        .replace(/\p{Diacritic}/gu, '')
        .replace(/[^a-z0-9_]/g, '')
        .toLowerCase();
    return base.slice(0, MAX_NAME);
}

/** Descripción de slash: 1-100 caracteres, sin saltos de línea. */
function toDescription(key, meta) {
    const text = (meta.description || meta.do || `Acción: ${DISPLAY_NAMES[key] || key}`)
        .replace(/\s+/g, ' ')
        .trim();
    return text.length <= 100 ? text : `${text.slice(0, 97)}…`;
}

function buildTemplate(key, meta, name) {
    const needsUser = !meta.solo;
    const userOption = needsUser
        ? `
        .addUserOption(o => o
            .setName('usuario')
            .setDescription('A quién se la hacés')
            .setRequired(true))`
        : '';

    return `// Generado por scripts/generateGifCommands.js — no editar a mano.
// Definición: src/lib/socialActions.js → "${key}"
const { SlashCommandBuilder } = require('discord.js');
const { executeSocialAction } = require('../../lib/socialExecutor');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('${name}')
        .setDescription('${toDescription(key, meta).replace(/'/g, "\\'")}')${userOption},

    name: '${name}',
    aliases: ${JSON.stringify(meta.aliases || [])},
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        return executeSocialAction('${key}', ctx, args);
    },
};
`;
}

const created = [];
const skipped = [];
const problems = [];
const taken = new Set();

for (const key of PUBLIC_ACTIONS) {
    if (only && only !== key) continue;

    const meta = SOCIAL_ACTIONS[key];
    const category = meta.gif || key;

    // Validación de coherencia: la categoría tiene que existir de verdad, o el
    // comando se rompería en runtime con un error poco descriptivo.
    if (!hasCategory(category)) {
        problems.push(`"${key}" apunta a la categoría "${category}" que no existe en gifApi.js`);
        continue;
    }
    if (meta.solo && meta.verb) {
        problems.push(`"${key}" es solo=${meta.solo} pero tiene verb: el panel quedaría con texto roto`);
    }
    if (!meta.solo && !meta.verb) {
        problems.push(`"${key}" necesita un verbo (no es solo) pero no tiene "verb"`);
    }
    if (meta.solo && !SOLO_PHRASES[key]) {
        problems.push(`"${key}" es solo pero no tiene frase en SOLO_PHRASES`);
    }

    const name = toCommandName(key);
    if (name.length < 2) {
        problems.push(`"${key}" no produce un nombre de comando válido ("${name}")`);
        continue;
    }
    if (RESERVED.has(name)) {
        problems.push(`"${key}" colisiona con un comando reservado: ${name}`);
        continue;
    }
    if (taken.has(name)) {
        problems.push(`"${key}" produce el mismo nombre que otro: ${name}`);
        continue;
    }
    taken.add(name);

    const file = path.join(HYBRID_DIR, name, `${name}.js`);

    if (fs.existsSync(file) && !force) {
        const existing = fs.readFileSync(file, 'utf8');
        if (!existing.includes('generateGifCommands.js')) {
            skipped.push(`${name} (escrito a mano, no se toca)`);
        } else {
            skipped.push(`${name} (ya existe)`);
        }
        continue;
    }

    if (dryRun) {
        created.push(`${name} — "${toDescription(key, meta)}"`);
        continue;
    }

    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, buildTemplate(key, meta, name));
    created.push(name);
}

const totalActions = PUBLIC_ACTIONS.length;
const totalCharacters = Object.keys(CHARACTER_CATEGORIES).length;
const totalGifCategories = Object.keys(GIF_CATEGORIES).length + Object.keys(EXTRA_CATEGORIES).length;

console.log(`[gif-commands] Acciones en el catálogo: ${totalActions} (${totalGifCategories} categorías de GIF disponibles)`);
console.log(`[gif-commands] Imágenes de personaje: ${totalCharacters}`);
console.log(`[gif-commands] ${created.length} creados, ${skipped.length} sin tocar.`);

if (problems.length) {
    console.log('\nProblemas a corregir en socialActions.js:');
    for (const p of problems) console.log(`  ✖ ${p}`);
    process.exitCode = 1;
}

if (created.length) {
    const show = created.slice(0, 20);
    console.log(`\n${dryRun ? 'Se crearían' : 'Creados'}:\n  ${show.join('\n  ')}${created.length > 20 ? `\n  …y ${created.length - 20} más` : ''}`);
}
