// src/music/loadMusicEvents.js
// Registra los listeners del reproductor Kazagumo (playerStart, playerEnd, etc.).

const fs = require('fs');
const path = require('path');

function loadMusicEvents(client) {
    if (!client.music) return;

    const eventsPath = path.join(__dirname, 'events');
    if (!fs.existsSync(eventsPath)) return;

    let loaded = 0;
    const files = fs.readdirSync(eventsPath).filter((f) => f.endsWith('.js'));

    for (const file of files) {
        const event = require(path.join(eventsPath, file));
        if (event.name && typeof event.run === 'function') {
            client.music.on(event.name, (...args) => event.run(client, ...args));
            loaded++;
        }
    }

    console.log(`[boot] Eventos del reproductor de música cargados (${loaded}).`);
}

module.exports = { loadMusicEvents };
