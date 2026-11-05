// scripts/countCommands.js
// Utilidad de verificación: cuenta cuántos comandos tiene el bot en total
// (slash commands + subcomandos), sin necesitar conectar a Discord.
//
// Uso: node scripts/countCommands.js

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const path = require('path');
const { Collection } = require('discord.js');
const { loadHybridCommands, loadSlashCommands, loadPrefixCommands } = require('../src/lib/commandLoader');

const fakeClient = { commands: new Collection(), prefixCommands: new Collection() };

loadHybridCommands(fakeClient, path.join(__dirname, '..', 'src', 'hybrid'));
loadSlashCommands(fakeClient, path.join(__dirname, '..', 'src', 'commands', 'slash'));
loadPrefixCommands(fakeClient, path.join(__dirname, '..', 'src', 'commands', 'prefix'));

let totalSubcommands = 0;
let commandsWithSubs = 0;

for (const [, command] of fakeClient.commands) {
    const json = command.data.toJSON();
    const subs = (json.options || []).filter(o => o.type === 1); // SUB_COMMAND
    if (subs.length > 0) {
        totalSubcommands += subs.length;
        commandsWithSubs++;
    }
}

const effectiveTotal = fakeClient.commands.size - commandsWithSubs + totalSubcommands;

console.log('========================================');
console.log(`Slash commands (grupos):      ${fakeClient.commands.size}`);
console.log(`  - con subcomandos:          ${commandsWithSubs}`);
console.log(`  - subcomandos totales:      ${totalSubcommands}`);
console.log(`Entradas de prefijo (+alias): ${fakeClient.prefixCommands.size}`);
console.log('----------------------------------------');
console.log(`TOTAL EFECTIVO DE COMANDOS: ${effectiveTotal}`);
console.log('========================================');
