// src/lib/registerCommands.js
// Registra los slash commands ante la API de Discord SOLO si el set cambió
// desde el último boot (comparación de hash). El registro global de Discord
// es rate-limited y puede tardar hasta 1h en propagar — no golpearlo en cada boot.
//
// Deyra tiene muchos más comandos "hybrid" (prefijo + slash) de los que
// Discord permite registrar como "/" en una sola aplicación. Cuando eso pasa,
// en vez de crashear el registro completo, recortamos por prioridad de
// categoría (ver config.SLASH_CATEGORY_PRIORITY) y dejamos el resto
// funcionando igual de bien como comando de prefijo — no se pierde ninguna
// función, solo el acceso "/" a los comandos de menor prioridad.

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { REST, Routes } = require('discord.js');
const config = require('../config');

const HASH_FILE = path.join(__dirname, '..', '..', '.commandHash');

function computeHash(commandsData) {
    const serialized = JSON.stringify(commandsData);
    return crypto.createHash('sha256').update(serialized).digest('hex');
}

/** Ordena los comandos por prioridad de categoría (más prioritaria primero). */
function sortByPriority(commands) {
    const order = config.SLASH_CATEGORY_PRIORITY || [];
    const rank = (cmd) => {
        const idx = order.indexOf(cmd.category);
        return idx === -1 ? order.length : idx; // sin categoría conocida = al final
    };
    return [...commands].sort((a, b) => rank(a) - rank(b));
}

/**
 * Selecciona qué comandos se registran como slash, respetando
 * config.MAX_SLASH_COMMANDS.
 *
 * Tres reglas, en este orden:
 *   1. Los de config.SLASH_ALWAYS_INCLUDE entran sí o sí. Son los que la
 *      gente busca por nombre en el menú de "/".
 *   2. El resto se reparte por TURNO entre las categorías, en el orden de
 *      config.SLASH_CATEGORY_PRIORITY. Repartir y no llenar por categorías es
 *      lo que hace que el menú "/" tenga de todo: si se llenara por prioridad
 *      pura, "utilidad" (221 comandos) se llevaría los 90 cupos y moderación o
 *      música no aparecerían nunca.
 *   3. Dentro de la misma categoría, orden alfabético. Es lo que hace que la
 *      selección sea idéntica en cada carga: sin esto el set depende del orden
 *      de lectura de archivos, el hash cambia en cada deploy y el bot
 *      re-registra los 90 comandos sin motivo.
 *
 * Devuelve { toRegister, dropped }.
 */
function selectCommandsToRegister(client) {
    const all = [...client.commands.values()];
    const max = config.MAX_SLASH_COMMANDS || 100;

    if (all.length <= max) {
        return { toRegister: all, dropped: [] };
    }

    const mustInclude = new Set(config.SLASH_ALWAYS_INCLUDE || []);
    const pinned = all.filter(c => mustInclude.has(c.data.name)).slice(0, max);
    const pinnedNames = new Set(pinned.map(c => c.data.name));

    // 1. Agrupar el resto por categoría, en orden alfabético dentro de cada una.
    const order = config.SLASH_CATEGORY_PRIORITY || [];
    const rank = (cat) => {
        const idx = order.indexOf(cat);
        return idx === -1 ? order.length : idx;
    };

    const groups = new Map();
    for (const command of all) {
        if (pinnedNames.has(command.data.name)) continue;
        const cat = command.category || 'utilidad';
        if (!groups.has(cat)) groups.set(cat, []);
        groups.get(cat).push(command);
    }
    for (const list of groups.values()) {
        list.sort((a, b) => a.data.name.localeCompare(b.data.name));
    }

    // 2. Los grupos ordenados por prioridad: primero los que cuentan más.
    const queues = [...groups.entries()]
        .sort((a, b) => {
            const diff = rank(a[0]) - rank(b[0]);
            if (diff !== 0) return diff;
            return a[0].localeCompare(b[0]);
        });

    // 3. Reparto por turno, con un tope por categoría. Cada "ronda" saca un
    //    comando de cada categoría que todavía tenga cupos; cuando una categoría
    //    llega a su tope, deja de participar en las rondas siguientes.
    const cap = config.MAX_SLASH_PER_CATEGORY || Infinity;
    const used = new Map();
    const roomLeft = (cat) => (used.get(cat) || 0) < cap;

    const picked = [];
    let remaining = max - pinned.length;
    let progress = true;

    while (remaining > 0 && progress) {
        progress = false;
        for (const [cat, queue] of queues) {
            if (remaining === 0) break;
            if (!roomLeft(cat)) continue;
            const command = queue.shift();
            if (!command) continue;
            picked.push(command);
            used.set(cat, (used.get(cat) || 0) + 1);
            remaining--;
            progress = true;
        }
    }

    // Lo que no entró, en el mismo orden estable.
    const pickedNames = new Set([...pinned, ...picked].map(c => c.data.name));
    const dropped = all
        .filter(c => !pickedNames.has(c.data.name))
        .sort((a, b) => {
            const diff = rank(a.category) - rank(b.category);
            if (diff !== 0) return diff;
            return a.data.name.localeCompare(b.data.name);
        });

    return { toRegister: [...pinned, ...picked], dropped };
}

async function putCommands(rest, body) {
    if (config.DEV_GUILD_ID) {
        return rest.put(
            Routes.applicationGuildCommands(config.CLIENT_ID, config.DEV_GUILD_ID),
            { body },
        );
    }
    return rest.put(
        Routes.applicationCommands(config.CLIENT_ID),
        { body },
    );
}

async function registerCommands(client) {
    const { toRegister, dropped } = selectCommandsToRegister(client);
    const commandsData = toRegister.map(c => c.data.toJSON());

    // El hash se calcula sobre TODO el set (incluyendo lo recortado) más el
    // límite/orden de prioridad, para que cualquier cambio relevante
    // (agregar comandos, subir/bajar MAX_SLASH_COMMANDS, reordenar
    // prioridades) invalide el cache y dispare un nuevo registro.
    const hashInput = {
        registered: commandsData,
        droppedNames: dropped.map(c => c.data.name).sort(),
        max: config.MAX_SLASH_COMMANDS,
    };
    const hash = computeHash(hashInput);

    let previousHash = null;
    try {
        previousHash = fs.readFileSync(HASH_FILE, 'utf8').trim();
    } catch {
        // primer boot, no hay hash previo
    }

    if (hash === previousHash) {
        console.log(`[commands] Sin cambios en ${commandsData.length} slash commands, se omite el registro.`);
        return;
    }

    const rest = new REST({ version: '10' }).setToken(config.BOT_TOKEN);
    const destino = config.DEV_GUILD_ID
        ? 'en el servidor de desarrollo (instantáneo)'
        : 'globalmente (puede tardar hasta 1h en propagar)';

    try {
        await putCommands(rest, commandsData);
        console.log(`[commands] ${commandsData.length} comandos registrados ${destino}.`);

        if (dropped.length > 0) {
            console.warn(
                `[commands] ${dropped.length} comandos no se registraron como "/" por el límite de Discord ` +
                `(MAX_SLASH_COMMANDS=${config.MAX_SLASH_COMMANDS}). Siguen funcionando normalmente con el prefijo ` +
                `"${config.PREFIX}". Primeros omitidos: ${dropped.slice(0, 15).map(c => c.data.name).join(', ')}` +
                `${dropped.length > 15 ? '...' : ''}`,
            );
        }

        fs.writeFileSync(HASH_FILE, hash);
    } catch (err) {
        // Si Discord sigue rechazando el body (p.ej. el límite real es más
        // bajo de lo esperado), reducimos a la mitad y reintentamos una vez
        // más antes de rendirnos, en vez de dejar el bot sin NINGÚN slash
        // command registrado.
        const isTooMany = err?.code === 50035;
        if (isTooMany && commandsData.length > 1) {
            console.warn(
                `[commands] Discord rechazó ${commandsData.length} comandos (límite real parece ser menor). ` +
                'Reintentando con la mitad de mayor prioridad...',
            );
            const half = toRegister.slice(0, Math.floor(toRegister.length / 2));
            const halfData = half.map(c => c.data.toJSON());
            try {
                await putCommands(rest, halfData);
                console.log(`[commands] ${halfData.length} comandos registrados tras el reintento.`);
                fs.writeFileSync(HASH_FILE, hash);
                return;
            } catch (err2) {
                console.error('[commands] El reintento también falló. Ningún comando "/" quedó registrado esta vez:', err2);
                return;
            }
        }

        console.error('[commands] Error registrando slash commands:', err);
    }
}

module.exports = { registerCommands, selectCommandsToRegister, putCommands };
