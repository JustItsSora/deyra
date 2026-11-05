// src/lib/animalApi.js
// Para especies que no tienen una API dedicada estable (oso, oveja, ardilla,
// serpiente, cerdo, conejo, zarigüeya) se usa un pool curado local
// (assets/animal-images.json) con fallback a una búsqueda en vivo si la
// categoría no está en el pool. El resto de animales (gato, perro, pato,
// pájaro, panda, panda rojo, zorro) ya tienen su propio comando con API
// dedicada en Deyra y no pasan por acá.

const axios = require('axios');
const fs = require('fs');
const path = require('path');

const JSON_FILE = path.join(__dirname, '..', 'assets', 'animal-images.json');

let pool = {};

function loadPool() {
    try {
        if (fs.existsSync(JSON_FILE)) {
            pool = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
        }
    } catch (_) {
        pool = {};
    }
}

loadPool();

const FALLBACK_QUERIES = {
    bear: ['cute bear photo', 'bear in nature photo', 'grizzly bear photo'],
    sheep: ['cute sheep photo', 'fluffy sheep photo', 'lamb photo cute'],
    squirrel: ['cute squirrel photo', 'adorable squirrel photo', 'squirrel in nature'],
    snake: ['beautiful snake photo', 'colorful snake photo', 'cute snake photo'],
    pig: ['cute pig photo', 'adorable piglet photo', 'mini pig cute'],
    bunny: ['cute bunny photo', 'adorable rabbit photo', 'fluffy bunny photo'],
    possum: ['cute possum photo', 'opossum photo cute', 'baby possum photo'],
};

const liveCache = {};
const LIVE_TTL = 5 * 60 * 1000;

async function fetchLive(animal) {
    const entry = liveCache[animal];
    if (entry && Date.now() - entry.at < LIVE_TTL && entry.urls.length > 0) {
        return entry.urls[Math.floor(Math.random() * entry.urls.length)];
    }

    const queries = FALLBACK_QUERIES[animal] || [`cute ${animal} photo`];
    const query = queries[Math.floor(Math.random() * queries.length)];

    try {
        const res = await axios.get('https://apidl.asepharyana.tech/api/search/pinterest', {
            params: { query },
            timeout: 15000,
        });
        const urls = (Array.isArray(res.data) ? res.data : [])
            .filter((p) => p.directLink)
            .map((p) => p.directLink);

        if (urls.length > 0) {
            liveCache[animal] = { urls, at: Date.now() };
            return urls[Math.floor(Math.random() * urls.length)];
        }
    } catch (_) {}
    return null;
}

async function fetchAnimalImage(animal) {
    const images = pool[animal];
    if (images && images.length > 0) {
        return images[Math.floor(Math.random() * images.length)];
    }
    return fetchLive(animal);
}

module.exports = { fetchAnimalImage };
