// src/lib/api/lookupApi.js
// Fuentes de consulta y contenido para /book, /tvshow, /brewery, /meal,
// /freegames, /steamgame, /iss, /chuckjoke, /urban, /song, /ghsearch.
//
// Todas sin API key y verificadas. Cada una va con su TTL de cache: no tiene
// sentido volver a pedir la ficha de un libro cada 3 segundos.

const http = require('../http');
const { withFallback } = require('../providers');

const HOUR = 60 * 60 * 1000;
const DAY = 24 * HOUR;

// --- Libros (Open Library) ---------------------------------------------------

/**
 * Busca un libro.
 * @param {string} query
 * @returns {Promise<{title: string, authors: string[], year: number|null, pages: number|null, cover: string|null, url: string|null, key: string}>}
 */
async function searchBook(query) {
    const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=5&fields=title,author_name,first_publish_year,key,cover_i,number_of_pages_median,ratings_average`;
    const { value } = await withFallback([{
        name: 'openlibrary',
        run: async () => {
            const data = await http.getJson(url, { provider: 'openlibrary', ttl: DAY, timeout: 12000 });
            const docs = (data?.docs || []).filter(d => d.title);
            if (!docs.length) {
                const e = new Error('Sin resultados');
                e.notFound = true;
                throw e;
            }
            const q = query.toLowerCase();
            return docs.find(d => d.title.toLowerCase() === q)
                || docs.find(d => d.title.toLowerCase().includes(q))
                || docs[0];
        },
    }], { label: 'book:search' });

    return {
        title: value.title,
        authors: value.author_name || [],
        year: value.first_publish_year || null,
        pages: value.number_of_pages_median || null,
        rating: value.ratings_average ? value.ratings_average.toFixed(2) : null,
        // La API de covers es un resize de imágenes: sin ?default la pide en
        // tamaño original, que puede pesar mucho. -M = medium.
        cover: value.cover_i ? `https://covers.openlibrary.org/b/id/${value.cover_i}-M.jpg` : null,
        url: value.key ? `https://openlibrary.org${value.key}` : null,
    };
}

// --- Series de TV ------------------------------------------------------------

/**
 * Busca una serie con su reparto.
 *
 * Proveedor principal: TVmaze (trae sinopsis, estado, cadena y elenco).
 * Respaldo: iTunes/Apple (artwork, año, géneros). Si TVmaze está caído, el
 * comando igual responde con la información básica en vez de un error.
 *
 * Los dos se normalizan al mismo shape, así el comando no se entera de cuál
 * respondió.
 *
 * @param {string} query
 */
async function searchShow(query) {
    const { value } = await withFallback([
        {
            name: 'tvmaze',
            run: async () => {
                const data = await http.getJson(
                    `https://api.tvmaze.com/singlesearch/shows?q=${encodeURIComponent(query)}&embed=cast&embed=network`,
                    { provider: 'tvmaze', ttl: DAY, timeout: 10000 },
                );
                if (!data?.name) {
                    const e = new Error('Sin resultados');
                    e.notFound = true;
                    throw e;
                }
                return {
                    name: data.name,
                    summary: (data.summary || '').replace(/<[^>]+>/g, '').trim(),
                    genres: data.genres || [],
                    status: data.status,
                    premiered: data.premiered,
                    network: data.network?.name || data.webChannel?.name || null,
                    runtime: data.averageRuntime || data.runtime || null,
                    rating: data.rating?.average ? `${data.rating.average.toFixed(1)}/10` : null,
                    image: data.image?.original || data.image?.medium || null,
                    url: data.url,
                    cast: (data._embedded?.cast || []).slice(0, 6).map(c => ({
                        name: c.person?.name,
                        character: c.character?.name,
                    })),
                };
            },
        },
        {
            name: 'itunes',
            run: async () => {
                const data = await http.getJson(
                    `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&limit=5&entity=tvSeason&country=US`,
                    { provider: 'itunes', ttl: DAY, timeout: 10000 },
                );
                const item = (data?.results || []).find(r => r.collectionName);
                if (!item) {
                    const e = new Error('Sin resultados');
                    e.notFound = true;
                    throw e;
                }
                return {
                    name: item.collectionName,
                    summary: null,
                    genres: item.genres || [],
                    status: null,
                    premiered: item.releaseDate ? item.releaseDate.slice(0, 10) : null,
                    network: item.artistName || null,
                    runtime: null,
                    rating: null,
                    // Reemplazo 100x100 por 600x600: el artwork chico se ve
                    // borroso en el panel.
                    image: item.artworkUrl100?.replace('100x100', '600x600') || null,
                    url: item.collectionViewUrl,
                    cast: [],
                };
            },
        },
    ], { label: 'tv:search' });

    return value;
}

// --- Cerveza (Open Brewery DB) -----------------------------------------------

/** Cervecería al azar. */
async function randomBrewery() {
    const { value } = await withFallback([{
        name: 'openbrewerydb',
        run: async () => {
            const list = await http.getJson('https://api.openbrewerydb.org/v1/breweries/random', {
                provider: 'openbrewerydb', ttl: HOUR, timeout: 12000,
            });
            const b = (list || [])[0];
            if (!b) throw new Error('Sin cervecerías');
            return b;
        },
    }], { label: 'brewery:random' });

    return {
        name: value.name,
        type: value.brewery_type,
        city: value.city,
        state: value.state,
        country: value.country,
        phone: value.phone,
        website: value.website_url,
    };
}

// --- Receta (TheMealDB) -----------------------------------------------------

/** Receta al azar, con imagen. */
async function randomMeal() {
    const { value } = await withFallback([{
        name: 'themealdb',
        run: async () => {
            const data = await http.getJson('https://www.themealdb.com/api/json/v1/1/random.php', {
                provider: 'themealdb', ttl: HOUR, timeout: 12000,
            });
            const meal = data?.meals?.[0];
            if (!meal) throw new Error('Sin recetas');
            return meal;
        },
    }], { label: 'meal:random' });

    const ingredients = [];
    for (let i = 1; i <= 20; i++) {
        const name = value[`strIngredient${i}`];
        const measure = value[`strMeasure${i}`];
        if (name && name.trim()) ingredients.push(`${name.trim()}${measure && measure.trim() ? ` — ${measure.trim()}` : ''}`);
    }

    return {
        name: value.strMeal,
        category: value.strCategory,
        area: value.strArea,
        image: value.strMealThumb,
        source: value.strSource,
        tags: value.strTags ? value.strTags.split(',').map(t => t.trim()) : [],
        ingredients,
        instructions: value.strInstructions,
    };
}

// --- Sorteos de juegos (GamePower) -------------------------------------------

/** Sorteos de juegos gratis, ordenados por valor. */
async function freeGames({ platform = 'pc', limit = 5 } = {}) {
    const { value } = await withFallback([{
        name: 'gamerpower',
        run: async () => http.getJson(
            'https://www.gamerpower.com/api/giveaways?platform=pc&sort-by=worth',
            { provider: 'gamerpower', ttl: 10 * 60 * 1000, timeout: 12000 },
        ),
    }], { label: 'giveaways' });

    return (value || []).slice(0, limit).map(g => ({
        title: g.title,
        worth: g.worth,
        image: g.thumbnail,
        url: g.open_giveaway_url,
        end: g.end_date,
        users: g.users,
        platforms: g.platforms,
    }));
}

// --- Steam (SteamSpy) --------------------------------------------------------

/** Ficha de un juego por su App ID de Steam. */
async function steamGame(appId) {
    const { value } = await withFallback([{
        name: 'steamspy',
        run: async () => {
            const data = await http.getJson(
                `https://steamspy.com/api.php?request=appdetails&appid=${encodeURIComponent(appId)}`,
                { provider: 'steamspy', ttl: DAY, timeout: 12000 },
            );
            if (!data?.name) {
                const e = new Error('Juego no encontrado');
                e.notFound = true;
                throw e;
            }
            return data;
        },
    }], { label: 'steam:app' });

    const total = (value.positive || 0) + (value.negative || 0);
    return {
        name: value.name,
        developer: value.developer,
        publisher: value.publisher,
        genre: value.genre,
        positive: value.positive || 0,
        negative: value.negative || 0,
        rating: total ? Math.round((value.positive / total) * 100) : null,
        owners: value.owners || null,
        price: value.price ? `$${value.price}` : 'Gratis',
        url: `https://store.steampowered.com/app/${appId}`,
    };
}

// --- ISS (Open Notify) ------------------------------------------------------

/** Posición actual de la Estación Espacial Internacional. */
async function issPosition() {
    const { value } = await withFallback([{
        name: 'open-notify',
        run: async () => {
            const data = await http.getJson('http://api.open-notify.org/iss-now.json', {
                provider: 'open-notify', ttl: 5000, timeout: 10000,
            });
            if (!data?.iss_position) throw new Error('Sin datos de posición');
            return data;
        },
    }], { label: 'iss:position' });

    return {
        latitude: Number(value.iss_position.latitude),
        longitude: Number(value.iss_position.longitude),
        timestamp: value.timestamp * 1000,
    };
}

// --- Chistes y definiciones --------------------------------------------------

/** Chiste de Chuck Norris. */
async function chuckJoke() {
    const { value } = await withFallback([{
        name: 'chucknorris',
        run: async () => http.getJson('https://api.chucknorris.io/jokes/random', {
            provider: 'chucknorris', ttl: 10 * 60 * 1000, timeout: 10000,
        }),
    }], { label: 'joke:chuck' });
    return { text: value.value, url: value.url };
}

/** Definición de Urban Dictionary. Requiere en-US porque si no da 404. */
async function urbanDefine(term) {
    const { value } = await withFallback([{
        name: 'urbandictionary',
        run: async () => {
            const data = await http.getJson(
                `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(term)}&locale=en-US`,
                { provider: 'urbandictionary', ttl: 6 * HOUR, timeout: 10000 },
            );
            const list = data?.list || [];
            if (!list.length) {
                const e = new Error('Término no encontrado');
                e.notFound = true;
                throw e;
            }
            return list.sort((a, b) => (b.thumbs_up || 0) - (a.thumbs_up || 0));
        },
    }], { label: 'urban:define' });

    return {
        word: value[0].word,
        definitions: value.slice(0, 3).map(d => ({
            text: d.definition,
            example: d.example,
            likes: d.thumbs_up,
        })),
    };
}

// --- Música (Deezer) --------------------------------------------------------

/** Canción por artista/título, con portada y enlace. */
async function searchSong(query) {
    const { value } = await withFallback([{
        name: 'deezer',
        run: async () => {
            const data = await http.getJson(
                `https://api.deezer.com/search?q=${encodeURIComponent(query)}&limit=5`,
                { provider: 'deezer', ttl: 6 * HOUR, timeout: 10000 },
            );
            const items = (data?.data || []).filter(t => t.title && t.artist);
            if (!items.length) {
                const e = new Error('Sin resultados');
                e.notFound = true;
                throw e;
            }
            const q = query.toLowerCase();
            return items.find(t => `${t.artist.name} ${t.title}`.toLowerCase().includes(q)) || items[0];
        },
    }], { label: 'deezer:search' });

    return {
        title: value.title,
        artist: value.artist.name,
        album: value.album?.title,
        cover: value.album?.cover_big || value.album?.cover_medium,
        duration: value.duration,
        url: value.link,
        preview: Boolean(value.preview),
    };
}

// --- GitHub -----------------------------------------------------------------

/** Repositorios por popularity. */
async function searchRepos(query, { sort = 'stars', limit = 5 } = {}) {
    const { value } = await withFallback([{
        name: 'github',
        run: async () => {
            const data = await http.getJson(
                `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&sort=${sort}&order=desc&per_page=${limit}`,
                { provider: 'github', ttl: HOUR, timeout: 12000 },
            );
            const items = data?.items || [];
            if (!items.length) {
                const e = new Error('Sin resultados');
                e.notFound = true;
                throw e;
            }
            return items;
        },
    }], { label: 'github:search' });

    return value.map(r => ({
        name: r.full_name,
        description: r.description,
        stars: r.stargazers_count,
        forks: r.forks_count,
        language: r.language,
        url: r.html_url,
        topics: r.topics || [],
    }));
}

module.exports = {
    searchBook, searchShow, randomBrewery, randomMeal, freeGames, steamGame,
    issPosition, chuckJoke, urbanDefine, searchSong, searchRepos,
};
