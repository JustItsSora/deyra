// src/lib/eventLoader.js
// Carga eventos "simples" (un archivo = { name, execute }) directamente bajo
// gateway/, y features multi-listener (subcarpeta con <feature>Events.js
// exportando { init(client) }) listadas explícitamente en EVENT_FEATURE_DIRS.

const fs = require('fs');
const path = require('path');

// Subcarpetas de src/gateway/ que exportan { init(client) } en vez de { name, execute }.
const EVENT_FEATURE_DIRS = ['automod', 'leveling', 'welcome', 'honeypot', 'antinuke', 'logging'];

function loadSimpleEvents(client, gatewayPath) {
    if (!fs.existsSync(gatewayPath)) return;
    const entries = fs.readdirSync(gatewayPath, { withFileTypes: true });

    for (const entry of entries) {
        if (entry.isDirectory()) continue;
        if (!entry.name.endsWith('.js')) continue;

        const fullPath = path.join(gatewayPath, entry.name);
        try {
            const event = require(fullPath);
            if (!event.name || !event.execute) continue;

            if (event.once) {
                client.once(event.name, (...args) => event.execute(...args, client));
            } else {
                client.on(event.name, (...args) => event.execute(...args, client));
            }
        } catch (err) {
            console.error(`[eventLoader] Error cargando evento "${entry.name}":`, err);
        }
    }
}

function loadFeatureEvents(client, gatewayPath) {
    for (const feature of EVENT_FEATURE_DIRS) {
        const featurePath = path.join(gatewayPath, feature, `${feature}Events.js`);
        if (!fs.existsSync(featurePath)) continue;

        try {
            const mod = require(featurePath);
            if (typeof mod.init === 'function') {
                mod.init(client);
            }
        } catch (err) {
            console.error(`[eventLoader] Error inicializando feature "${feature}":`, err);
        }
    }
}

function loadInteractionHandlers(gatewayPath) {
    const handlersDir = path.join(gatewayPath, 'interactions');
    const handlers = new Map(); // prefix -> handler module

    if (!fs.existsSync(handlersDir)) return handlers;

    const files = fs.readdirSync(handlersDir).filter(f => f.endsWith('.js'));
    for (const file of files) {
        try {
            const mod = require(path.join(handlersDir, file));
            // Convención: <feature>Handler.js maneja customIds que empiezan con "<feature>_"
            const prefix = file.replace('Handler.js', '');
            handlers.set(prefix, mod);
        } catch (err) {
            console.error(`[eventLoader] Error cargando interaction handler "${file}":`, err);
        }
    }

    return handlers;
}

module.exports = { loadSimpleEvents, loadFeatureEvents, loadInteractionHandlers, EVENT_FEATURE_DIRS };
