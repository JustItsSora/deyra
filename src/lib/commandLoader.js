// src/lib/commandLoader.js
// Recorre los directorios de comandos y los registra en las Collections del
// client. Añadir un comando nuevo = añadir un archivo nuevo, nada más.

const fs = require('fs');
const path = require('path');

function loadHybridCommands(client, hybridPath) {
    if (!fs.existsSync(hybridPath)) return;
    const dirs = fs.readdirSync(hybridPath, { withFileTypes: true }).filter(e => e.isDirectory());

    for (const dir of dirs) {
        const commandPath = path.join(hybridPath, dir.name, `${dir.name}.js`);
        if (!fs.existsSync(commandPath)) continue;

        try {
            const command = require(commandPath);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
            if ('name' in command && 'execute' in command) {
                client.prefixCommands.set(command.name, command);
                (command.aliases || []).forEach(alias => client.prefixCommands.set(alias, command));
            }
        } catch (err) {
            console.error(`[commandLoader] Error cargando hybrid command "${dir.name}":`, err);
        }
    }
}

function walkJsFiles(dirPath, { skipDirs = [] } = {}) {
    let results = [];
    if (!fs.existsSync(dirPath)) return results;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            if (skipDirs.includes(entry.name)) continue;
            results = results.concat(walkJsFiles(fullPath, { skipDirs }));
        } else if (entry.name.endsWith('.js')) {
            results.push(fullPath);
        }
    }
    return results;
}

function loadSlashCommands(client, slashPath) {
    const files = walkJsFiles(slashPath, { skipDirs: ['subcommands'] });
    for (const file of files) {
        try {
            const command = require(file);
            if ('data' in command && 'execute' in command) {
                client.commands.set(command.data.name, command);
            }
        } catch (err) {
            console.error(`[commandLoader] Error cargando slash command "${file}":`, err);
        }
    }
}

function loadPrefixCommands(client, prefixPath) {
    const files = walkJsFiles(prefixPath);
    for (const file of files) {
        try {
            const command = require(file);
            if ('name' in command && 'execute' in command) {
                client.prefixCommands.set(command.name, command);
                (command.aliases || []).forEach(alias => client.prefixCommands.set(alias, command));
            }
        } catch (err) {
            console.error(`[commandLoader] Error cargando prefix command "${file}":`, err);
        }
    }
}

module.exports = { loadHybridCommands, loadSlashCommands, loadPrefixCommands, walkJsFiles };
