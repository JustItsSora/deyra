// src/lib/animeGifApi.js
// Shim de compatibilidad. La implementación real vive en src/lib/gifApi.js
// (que además trae circuit breaker, sinónimos en español y las categorías
// reales de nekos.best). Este archivo queda para que cualquier require viejo
// siga funcionando durante la transición.

const gifApi = require('./gifApi');

module.exports = {
    getActionGif: gifApi.getActionGif,
    getCharacterImage: gifApi.getCharacterImage,
    searchGif: gifApi.searchGif,
    matchCategory: gifApi.matchCategory,
    listGifCategories: gifApi.listGifCategories,
    // `ENDPOINT_MAP` era el nombre viejo del mapa de categorías; se mantiene el
    // alias para no romper imports.
    ENDPOINT_MAP: gifApi.GIF_CATEGORIES,
    GIF_CATEGORIES: gifApi.GIF_CATEGORIES,
    CHARACTER_CATEGORIES: gifApi.CHARACTER_CATEGORIES,
    DISPLAY_NAMES: gifApi.DISPLAY_NAMES,
};
