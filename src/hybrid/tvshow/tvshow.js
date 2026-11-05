// /tvshow — ficha de una serie (TVmaze, sin API key).

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { searchShow } = require('../../lib/api/lookupApi');
const ui = require('../../lib/ui');

function statusLabel(status) {
    if (status === 'Running') return '🔄 En emisión';
    if (status === 'Ended') return '✅ Terminada';
    if (status === 'To be announced') return '⏳ Sin fecha';
    return status || '—';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tvshow')
        .setDescription('Busca una serie de TV y muestra su ficha con el reparto')
        .addStringOption(o => o
            .setName('titulo')
            .setDescription('Nombre de la serie')
            .setRequired(true)),

    name: 'tvshow',
    aliases: ['serie', 'show', 'tvshowsuggest'],
    category: 'diversión',
    cooldownMs: 5000,

    async execute(ctx, args = []) {
        const query = isSlash(ctx) ? ctx.options.getString('titulo') : args.join(' ');
        if (!query) {
            return reply(ctx, ui.missingArgument('Falta el título', '¿Qué serie querés que busque?', { usage: '/tvshow arcane' }));
        }

        let show;
        try {
            show = await searchShow(query);
        } catch (err) {
            if (err.notFound) {
                return reply(ctx, ui.empty('No encontré esa serie', `Sin resultados para **${ui.truncate(query, 60)}**.`, { hint: 'Probá en inglés.' }));
            }
            console.error('[tvshow] Error:', err.message);
            return reply(ctx, ui.error('No pude consultar TVmaze', 'La fuente de series no respondió.', { ephemeral: true }));
        }

        const grid = [
            ['Estado', statusLabel(show.status)],
            ['Estreno', show.premiered || '—'],
            ['Cadena', show.network || '—'],
            ['Duración', show.runtime ? `${show.runtime} min` : '—'],
            ['Rating', show.rating || '—'],
        ];

        const summary = show.summary.length > 600
            ? `${show.summary.slice(0, 600).replace(/\s+\S*$/, '')}…`
            : show.summary;

        const cast = show.cast.length ? [{
            tone: 'muted',
            text: `**Reparto principal:** ${ui.joinAnd(show.cast.slice(0, 5).map(c => `${c.character || '?'} (${c.name})`))}`,
        }] : undefined;

        return reply(ctx, ui.imagePayload({
            category: 'diversión',
            icon: '📺',
            kicker: 'Series de TV',
            title: show.name,
            caption: summary || (show.premiered ? `Estreno en ${show.premiered}.` : 'Sin sinopsis disponible.'),
            media: show.image ? { url: show.image, description: show.name } : null,
            source: show.cast.length ? 'TVmaze' : 'iTunes',
            sourceUrl: show.url,
            grid,
            lists: show.genres.length ? [{ title: 'Géneros', items: show.genres }] : undefined,
            callouts: cast,
        }));
    },
};
