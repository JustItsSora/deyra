// src/hybrid/help/help.js
// Menú de /help. El listado por categoría vive en src/lib/helpView.js y lo
// reusa el handler de botones (src/gateway/interactions/helpHandler.js).

const {
    SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder,
} = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const config = require('../../config');
const { CATEGORY_LABELS, buildCategoryPage } = require('../../lib/helpView');
const ui = require('../../lib/ui');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('help')
        .setDescription(`Muestra todos los comandos de ${config.BOT_NAME}, con una breve descripción de cada uno`)
        .addStringOption((o) => o.setName('categoria').setDescription('Filtra directamente por categoría').setRequired(false)),

    name: 'help',
    aliases: ['ayuda', 'comandos'],
    category: 'utilidad',
    cooldownMs: 3000,

    // Autocompletado de categorías con acentos: /help música y /help musica
    // deberían llevar al mismo lado.
    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        const raw = String(focused || '').toLowerCase();
        const normalize = (s) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');

        const options = Object.keys(CATEGORY_LABELS)
            .filter((cat) => !raw
                || normalize(cat).includes(normalize(raw))
                || normalize(CATEGORY_LABELS[cat]).includes(normalize(raw)))
            .slice(0, 25)
            .map((cat) => ({ name: CATEGORY_LABELS[cat], value: cat }));

        await interaction.respond(options).catch(() => {});
    },

    async execute(ctx, args = []) {
        const client = ctx.client;
        const byCategory = {};

        for (const command of client.commands.values()) {
            const cat = command.category || 'utilidad';
            if (!byCategory[cat]) byCategory[cat] = [];
            byCategory[cat].push(command);
        }

        const categories = Object.keys(byCategory).sort();

        // Uso directo: /help categoria:música  ó  !help música
        const requestedCategory = isSlash(ctx)
            ? ctx.options.getString('categoria')
            : args.join(' ').trim();

        if (requestedCategory) {
            const match = findCategory(categories, requestedCategory);
            if (match) {
                return reply(ctx, buildCategoryPage(byCategory, categories, match, 0));
            }
            return reply(ctx, ui.empty(
                'Categoría desconocida',
                `No tengo una categoría llamada **${ui.truncate(requestedCategory, 40)}**.`,
                { hint: `Disponibles: ${categories.join(', ')}` },
            ));
        }

        const totalCommands = client.commands.size;
        const bySize = categories
            .map((cat) => ({ cat, count: byCategory[cat].length }))
            .sort((a, b) => b.count - a.count);

        const menu = new StringSelectMenuBuilder()
            .setCustomId('help_category')
            .setPlaceholder('📂 Elegí una categoría')
            .addOptions(categories.slice(0, 25).map((cat) => ({
                label: CATEGORY_LABELS[cat] || cat,
                value: cat,
                description: `${byCategory[cat].length} comando${byCategory[cat].length === 1 ? '' : 's'}`,
            })));

        return reply(ctx, ui.payload({
            category: 'utilidad',
            kicker: 'Centro de ayuda',
            title: `Comandos de ${config.BOT_NAME}`,
            icon: '📖',
            description: [
                `Tengo **${totalCommands}** comandos en **${categories.length}** categorías.`,
                'Elegí una categoría abajo para ver la lista con una descripción de cada comando.',
            ].join('\n'),
            lists: [{
                title: 'Accesos directos',
                items: [
                    '`/help categoria:música` — salta directo a esa categoría',
                    '`!help música` — lo mismo, con prefijo',
                    '`/help moderación` — acepta también sin acentos',
                ],
            }],
            grid: bySize.slice(0, 6).map(({ cat, count }) => [CATEGORY_LABELS[cat] || cat, `${count} cmds`]),
            callouts: bySize.length > 6 ? [{
                tone: 'muted',
                text: `…y ${bySize.length - 6} categorías más en el menú de abajo.`,
            }] : undefined,
            rows: [new ActionRowBuilder().addComponents(menu)],
        }));
    },
};

/** Busca una categoría tolerando acentos, mayúsculas y palabras parciales. */
function findCategory(categories, query) {
    const normalize = (s) => String(s).toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
    const q = normalize(query).trim();
    if (!q) return null;

    return categories.find((cat) => normalize(cat) === q)
        || categories.find((cat) => normalize(CATEGORY_LABELS[cat] || '').includes(q))
        || categories.find((cat) => normalize(cat).includes(q))
        || null;
}
