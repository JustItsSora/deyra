// /animeinfo — ficha de un anime desde MyAnimeList (vía Jikan, sin API key).
//
// Jikan tiene rate limit de ~3 req/s y 60 por minuto. Por eso:
//   · la respuesta se cachea 6 h (un anime no cambia de rating tan seguido),
//   · los errores 429 se reintentan solos con el tiempo que manda la API,
//   · el timeout es largo (20 s) y reintentable: Jikan es una API gratuita y
//     a veces tarda más de 10 s en responder un search en frío.

const { SlashCommandBuilder } = require('discord.js');
const http = require('../../lib/http');
const { reply, isSlash } = require('../../lib/reply');
const ui = require('../../lib/ui');

const JIKAN = 'https://api.jikan.moe/v4';
const TTL = 6 * 60 * 60 * 1000; // 6 horas
const TIMEOUT = 20000;

/** Busca un anime por título. Devuelve el primer resultado útil. */
async function searchAnime(query) {
    const url = `${JIKAN}/anime?q=${encodeURIComponent(query)}&limit=5&sfw=true`;
    const data = await http.getJson(url, {
        provider: 'jikan',
        ttl: TTL,
        timeout: TIMEOUT,
        retries: 2,
        // Si se venció el tiempo, se reintenta: la respuesta llega, solo que
        // más tarde de lo que el primer intento esperaba.
        retryOnTimeout: true,
    });
    const items = (data?.data || []).filter(a => a?.title);
    if (!items.length) {
        const err = new Error('Sin resultados');
        err.notFound = true;
        throw err;
    }

    // Preferimos coincidencia exacta o parcial sobre cualquier cosa.
    const q = query.toLowerCase();
    return items.find(a => a.title.toLowerCase() === q)
        || items.find(a => a.title.toLowerCase().includes(q) || (a.titles || []).some(t => t.title?.toLowerCase().includes(q)))
        || items[0];
}

function score(anime) {
    return anime.score ? `⭐ ${anime.score.toFixed(2)} / 10` : '—';
}

function status(es) {
    if (!es) return '—';
    if (es === 'Finished Airing') return '✅ Terminado';
    if (es === 'Currently Airing') return '🔄 En emisión';
    if (es === 'Not yet aired') return '⏳ Estreno pendiente';
    return es;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('animeinfo')
        .setDescription('Busca un anime por nombre y muestra su ficha')
        .addStringOption(o => o
            .setName('titulo')
            .setDescription('Nombre del anime, en español o inglés')
            .setRequired(true)),

    name: 'animeinfo',
    aliases: ['anime', 'aniinfo'],
    category: 'diversión',
    cooldownMs: 5000,

    async execute(ctx, args = []) {
        const query = isSlash(ctx) ? ctx.options.getString('titulo') : args.join(' ');
        if (!query) {
            return reply(ctx, ui.missingArgument('Falta el título', 'Decime qué anime querés que busque.', { usage: '/animeinfo one piece' }));
        }

        let anime;
        try {
            anime = await searchAnime(query);
        } catch (err) {
            if (err.notFound) {
                return reply(ctx, ui.empty(
                    'No encontré ese anime',
                    `No hay resultados para **${ui.truncate(query, 60)}**.`,
                    { hint: 'Probá con el título en japonés, en inglés, o más corto.' },
                ));
            }
            console.error('[animeinfo] Error:', err.message);
            return reply(ctx, ui.error(
                'No pude consultar MyAnimeList',
                'La API de anime no respondió ahora mismo.',
                { hint: 'Probá de nuevo en unos segundos.', ephemeral: true },
            ));
        }

        const genres = (anime.genres || []).map(g => g.name).slice(0, 5);
        const studios = (anime.studios || []).map(s => s.name).slice(0, 3);
        const titles = (anime.titles || [])
            .filter(t => ['English', 'Japanese', 'Spanish'].includes(t.type))
            .map(t => `${t.type}: ${t.title}`);

        const grid = [
            ['Episodios', anime.episodes ?? '—'],
            ['Duración', anime.duration ? `\`${anime.duration}\`` : '—'],
            ['Emitido', anime.aired?.from ? `<t:${Date.parse(anime.aired.from) / 1000}:date>` : '—'],
            ['Puntaje', score(anime)],
            ['Popularidad', anime.members ? `#${ui.compact(anime.members)}` : '—'],
            ['Studio', studios.join(', ') || '—'],
        ];

        return reply(ctx, ui.imagePayload({
            category: 'diversión',
            icon: '📺',
            kicker: 'MyAnimeList',
            title: anime.title,
            caption: [
                anime.title_english && anime.title_english !== anime.title ? `**${anime.title_english}**` : null,
                anime.title_japanese ? `\`${anime.title_japanese}\`` : null,
                genres.length ? genres.map(g => `\`${g}\``).join(' ') : null,
            ].filter(Boolean).join('\n') || null,
            media: anime.images?.jpg?.largeImageUrl
                ? { url: anime.images.jpg.largeImageUrl, description: anime.title }
                : null,
            source: 'MyAnimeList (Jikan)',
            sourceUrl: anime.url || null,
            grid,
            lists: titles.length ? [{ title: 'Títulos alternativos', items: titles }] : undefined,
            callouts: [{
                tone: 'info',
                text: `**Estado:** ${status(anime.status)} · **Demografía:** ${anime.demographic?.slice(0, 2).join(', ') || '—'}`,
            }],
        }));
    },
};
