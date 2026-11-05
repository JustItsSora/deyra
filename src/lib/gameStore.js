// src/lib/gameStore.js
// Estado de juegos activos en memoria, por canal (un juego activo a la vez por canal).
// Suficiente para una sola instancia del bot; no persiste entre reinicios (intencional,
// los juegos son efímeros).

const games = new Map(); // channelId -> { type, ...gameState }

function getGame(channelId) {
    return games.get(channelId) || null;
}

function setGame(channelId, state) {
    games.set(channelId, state);
}

function endGame(channelId) {
    games.delete(channelId);
}

module.exports = { getGame, setGame, endGame };
