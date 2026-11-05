// /book — ficha de un libro (Open Library, sin API key).
// Complementa a /booksuggestion (que tira un título al azar): este busca uno
// concreto y trae portada, año, páginas y rating.

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { searchBook } = require('../../lib/api/lookupApi');
const ui = require('../../lib/ui');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('book')
        .setDescription('Busca un libro por título y muestra su ficha')
        .addStringOption(o => o
            .setName('titulo')
            .setDescription('Nombre del libro')
            .setRequired(true)),

    name: 'book',
    aliases: ['libro', 'booksuggest'],
    category: 'diversión',
    cooldownMs: 5000,

    async execute(ctx, args = []) {
        const query = isSlash(ctx) ? ctx.options.getString('titulo') : args.join(' ');
        if (!query) {
            return reply(ctx, ui.missingArgument('Falta el título', '¿Qué libro querés que busque?', { usage: '/book dune' }));
        }

        let book;
        try {
            book = await searchBook(query);
        } catch (err) {
            if (err.notFound) {
                return reply(ctx, ui.empty(
                    'No encontré ese libro',
                    `Sin resultados para **${ui.truncate(query, 60)}**.`,
                    { hint: 'Probá con el título original, sin autor ni subtítulo.' },
                ));
            }
            console.error('[book] Error:', err.message);
            return reply(ctx, ui.error('No pude consultar Open Library', 'La fuente de libros no respondió.', { ephemeral: true }));
        }

        const grid = [
            ['Autor', book.authors.join(', ') || '—'],
            ['Publicado', book.year ? String(book.year) : '—'],
            ['Páginas', book.pages ? String(book.pages) : '—'],
            ['Rating', book.rating ? `⭐ ${book.rating} / 5` : '—'],
        ];

        return reply(ctx, ui.imagePayload({
            category: 'diversión',
            icon: '📚',
            kicker: 'Open Library',
            title: book.title,
            caption: book.authors.length ? `por **${ui.joinAnd(book.authors.slice(0, 3))}**` : null,
            media: book.cover ? { url: book.cover, description: `Portada de ${book.title}` } : null,
            source: 'Open Library',
            sourceUrl: book.url,
            grid,
            callouts: book.cover ? undefined : [{ tone: 'muted', text: 'Este libro no tiene portada en Open Library.' }],
        }));
    },
};
