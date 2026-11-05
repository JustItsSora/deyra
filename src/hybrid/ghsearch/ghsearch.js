// /ghsearch — busca repositorios de GitHub por estrellas (sin API key; la
// API pública permite 10 requests/min sin autenticar, por eso el cooldown
// es alto y la respuesta se cachea una hora).

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { searchRepos } = require('../../lib/api/lookupApi');
const ui = require('../../lib/ui');

const SORTS = {
    stars: { value: 'stars', name: '⭐ Más estrellas' },
    forks: { value: 'forks', name: '🍴 Más forks' },
    updated: { value: 'updated', name: '🕐 Actualizados reciente' },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ghsearch')
        .setDescription('Busca repositorios de GitHub')
        .addStringOption(o => o
            .setName('consulta')
            .setDescription('Tecnologías, proyecto, autor...')
            .setRequired(true))
        .addStringOption(o => o
            .setName('orden')
            .setDescription('Cómo ordenar los resultados')
            .setRequired(false)
            .addChoices(...Object.values(SORTS).map(s => ({ name: s.name, value: s.value })))),

    name: 'ghsearch',
    aliases: ['github', 'repos', 'gh'],
    category: 'utilidad',
    cooldownMs: 15000,

    async execute(ctx, args = []) {
        const slash = isSlash(ctx);
        const query = slash ? ctx.options.getString('consulta') : args[0];
        const sort = slash ? ctx.options.getString('orden') : args[1];

        if (!query) {
            return reply(ctx, ui.missingArgument('Falta la consulta', '¿Qué querés buscar en GitHub?', { usage: '/ghsearch discord.js' }));
        }

        let repos;
        try {
            repos = await searchRepos(query, { sort: SORTS[sort] ? sort : 'stars', limit: 5 });
        } catch (err) {
            if (err.notFound) {
                return reply(ctx, ui.empty('Sin resultados', `Ningún repositorio coincide con **${ui.truncate(query, 50)}**.`));
            }
            if (/403|rate/i.test(err.message)) {
                return reply(ctx, ui.error(
                    'GitHub nos limitó',
                    'La API pública permite 10 búsquedas por minuto sin token. Esperá un momento.',
                    { hint: err.message.slice(0, 160), ephemeral: true },
                ));
            }
            console.error('[ghsearch] Error:', err.message);
            return reply(ctx, ui.error('No pude consultar GitHub', 'La API no respondió.', { ephemeral: true }));
        }

        return reply(ctx, ui.payload({
            category: 'utilidad',
            icon: '📦',
            kicker: 'GitHub',
            title: `Repos para "${ui.truncate(query, 40)}"`,
            description: 'Ordenados por número de estrellas.',
            lists: repos.map(r => ({
                title: `${r.name}  ⭐${ui.compact(r.stars)}`,
                items: [
                    ui.truncate(r.description || 'Sin descripción', 150),
                    `**Lenguaje:** ${r.language || '—'} · **Forks:** ${ui.compact(r.forks)}`,
                    `${r.url}`,
                ],
            })),
            footerText: 'Datos: GitHub Search API',
        }));
    },
};
