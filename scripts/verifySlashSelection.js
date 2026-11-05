// scripts/verifySlashSelection.js
// Verifica la selección de slash commands sin tocar Discord.
//
// El problema que previene: cuando el bot tiene más comandos de los que
// Discord acepta (90), hay que elegir cuáles se registran. Si esa elección
// depende del orden en que se leen los archivos, el set cambia entre deploys
// sin que haya ningún cambio real, y el bot re-registra los 90 comandos una y
// otra vez (y tarda hasta una hora en propagarse).
//
// Chequea:
//   1. Que no haya más de MAX_SLASH_COMMANDS.
//   2. Que la selección sea ESTABLE entre dos cargas independientes.
//   3. Que los comandos "pinned" (SLASH_ALWAYS_INCLUDE) estén siempre.
//   4. Que cada comando registrado serialice bien.
//
// Uso: node scripts/verifySlashSelection.js

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const path = require('path');
const { Collection } = require('discord.js');
const { loadHybridCommands, loadSlashCommands, loadPrefixCommands } = require('../src/lib/commandLoader');
const { selectCommandsToRegister } = require('../src/lib/registerCommands');
const config = require('../src/config');

const SRC = path.join(__dirname, '..', 'src');

function load() {
    const client = { commands: new Collection(), prefixCommands: new Collection() };
    loadHybridCommands(client, path.join(SRC, 'hybrid'));
    loadSlashCommands(client, path.join(SRC, 'commands', 'slash'));
    loadPrefixCommands(client, path.join(SRC, 'commands', 'prefix'));
    return client;
}

const problems = [];
const fail = (m) => problems.push(m);

const first = load();
const second = load();

console.log(`Comandos cargados: ${first.commands.size} (slash) · ${first.prefixCommands.size} (prefijo)`);

const sel1 = selectCommandsToRegister(first);
const sel2 = selectCommandsToRegister(second);

const max = config.MAX_SLASH_COMMANDS || 100;

// 1. Límite
if (sel1.toRegister.length > max) {
    fail(`Se seleccionaron ${sel1.toRegister.length} comandos, más del máximo (${max}). Discord los va a rechazar.`);
}

// 2. Estabilidad: dos cargas independientes tienen que dar el mismo set.
const names1 = sel1.toRegister.map(c => c.data.name).sort().join('|');
const names2 = sel2.toRegister.map(c => c.data.name).sort().join('|');
if (names1 !== names2) {
    const a = new Set(sel1.toRegister.map(c => c.data.name));
    const b = new Set(sel2.toRegister.map(c => c.data.name));
    const soloA = [...a].filter(n => !b.has(n));
    const soloB = [...b].filter(n => !a.has(n));
    fail(`La selección NO es estable entre cargas. Solo en la primera: ${soloA.join(', ') || '—'}. Solo en la segunda: ${soloB.join(', ') || '—'}.`);
}

// 3. Pinned
for (const name of config.SLASH_ALWAYS_INCLUDE || []) {
    if (!sel1.toRegister.some(c => c.data.name === name)) {
        fail(`"${name}" está en SLASH_ALWAYS_INCLUDE pero no fue seleccionado.`);
    }
}

// 4. Que todo serialice (Discord rechaza el body entero si UN comando está mal).
for (const command of sel1.toRegister) {
    try {
        command.data.toJSON();
    } catch (err) {
        fail(`/${command.data.name}: no serializa — ${err.message.slice(0, 70)}`);
    }
}

// Informe
const byCategory = {};
for (const c of sel1.toRegister) byCategory[c.category] = (byCategory[c.category] || 0) + 1;

console.log(`\nSe registran ${sel1.toRegister.length} slash commands (máx ${max}):`);
for (const [cat, count] of Object.entries(byCategory).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(3)}  ${cat}`);
}

if (sel1.dropped.length) {
    console.log(`\n${sel1.dropped.length} comandos quedan solo con prefijo ("${config.PREFIX}comando"):`);
    const byCat = {};
    for (const c of sel1.dropped) byCat[c.category] = (byCat[c.category] || 0) + 1;
    for (const [cat, count] of Object.entries(byCat).sort((a, b) => b[1] - a[1])) {
        console.log(`  ${String(count).padStart(3)}  ${cat}`);
    }
}

console.log('\n══════════ SELECCIÓN DE SLASH ══════════');
if (problems.length) {
    for (const p of problems) console.log(`  ✖ ${p}`);
    process.exit(1);
}
console.log('✔ La selección es válida y estable.');
