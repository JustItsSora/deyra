// src/lib/snipeStore.js
// Guarda el último mensaje borrado y el último editado por canal, en memoria.
// Se limpia solo (no crece indefinidamente) porque cada canal solo guarda 1 entrada.

const deletedStore = new Map(); // channelId -> { content, authorTag, authorAvatar, timestamp }
const editedStore = new Map();  // channelId -> { before, after, authorTag, authorAvatar, timestamp }

function recordDeleted(channelId, data) {
    deletedStore.set(channelId, data);
}
function getDeleted(channelId) {
    return deletedStore.get(channelId) || null;
}

function recordEdited(channelId, data) {
    editedStore.set(channelId, data);
}
function getEdited(channelId) {
    return editedStore.get(channelId) || null;
}

module.exports = { recordDeleted, getDeleted, recordEdited, getEdited };
