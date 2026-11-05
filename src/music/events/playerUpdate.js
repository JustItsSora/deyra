// src/music/events/playerUpdate.js
//
// Lavalink manda este evento cuando cambia la posición, el volumen o el estado
// de la pista: o sea, varias veces por segundo mientras suena.
//
// Antes era un stub vacío (`run: async () => {}`). Ahora mueve la barra de
// progreso del panel, pero con una restricción importante: NO se edita el
// mensaje en cada evento. Discord tiene un rate limit durísimo de-ediciones
// (5 por 5 s por canal) y un panel que se actualiza a 4 Hz se auto-sanciona:
// la API devuelve 429 y el resto de los comandos del canal empiezan a fallar.
//
// Se edita como máximo una vez cada UPDATE_MIN_INTERVAL_MS, y solo si la barra
// cambió de veras (comparar la posición redondeada evita el 90% de los casos:
// el 90% de los eventos de playerUpdate no mueven la barra, solo el volumen o
// el estado de buffer).

const { refreshPanel } = require('../../gateway/interactions/musicHandler');

const UPDATE_MIN_INTERVAL_MS = 5000;

// Un Map chico en vez de guardar el timer en player.data: player.data se
// borra en playerDestroy y acá se llama desde muchos players a la vez.
const lastEdit = new Map();

module.exports = {
    name: 'playerUpdate',
    run: async (client, player) => {
        try {
            const message = player.data?.get('message');
            if (!message) return;

            const track = player.queue?.current;
            if (!track) return;

            // Sin barra (stream sin duración) no hay nada que refrescar.
            if (!track.length || track.length <= 0) return;

            const position = typeof player.position === 'number' ? player.position : 0;
            const key = message.id;

            const last = lastEdit.get(key) || 0;
            const now = Date.now();
            if (now - last < UPDATE_MIN_INTERVAL_MS) return;

            // Solo si la barra se movió al menos medio bloque (14 bloques sobre
            // la duración de la pista).
            const lastPosition = player.data.get('panelPosition') || 0;
            const blockSize = (track.length / 14) / 1000;
            if (Math.abs(position - lastPosition) < blockSize) return;

            lastEdit.set(key, now);
            player.data.set('panelPosition', position);

            await refreshPanel(client, player);
        } catch (err) {
            // Un 429 acá no es motivo para loguear cada vez: se come el error.
            if (!/429|rate limit/i.test(err?.message || '')) {
                console.warn('[playerUpdate]:', err.message);
            }
        }
    },
};
