// /memetemplate — plantillas de meme con sus cajas de texto.
// imgflip expone el catálogo real (200+ plantillas), así que el comando puede
// mostrar nombres de verdad en vez de adivinar. Sin argumentos trae 8 al azar.

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { listTemplates } = require('../../lib/api/memeApi');
const ui = require('../../lib/ui');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('memetemplate')
        .setDescription('Muestra plantillas de memes con su imagen en blanco')
        .addIntegerOption(o => o
            .setName('cantidad')
            .setDescription('Cuántas plantillas querés (1 a 8, por defecto 6)')
            .setMinValue(1)
            .setMaxValue(8)
            .setRequired(false)),

    name: 'memetemplate',
    aliases: ['plantillas', 'memetemplates'],
    category: 'diversión',
    cooldownMs: 5000,

    async execute(ctx, args = []) {
        const amount = isSlash(ctx) ? ctx.options.getInteger('cantidad') : parseInt(args[0], 10);
        const count = Number.isFinite(amount) && amount > 0 ? Math.min(amount, 8) : 6;

        let templates;
        try {
            templates = await listTemplates({ limit: 100 });
        } catch (err) {
            console.error('[memetemplate] Error:', err.message);
            return reply(ctx, ui.error(
                'No pude obtener las plantillas',
                'El catálogo de memes no respondió ahora mismo.',
                { hint: 'Probá de nuevo en unos segundos.', ephemeral: true },
            ));
        }

        if (!templates.length) {
            return reply(ctx, ui.empty('Sin plantillas', 'El catálogo vino vacío. Probá más tarde.'));
        }

        // Toma una muestra dispersa: las 6 primeras de la lista son casi siempre
        // las mismas, y se vuelven aburridas al segundo uso.
        const picked = sample(templates, count);
        const rows = chunk(picked, 8).map(group => new ActionRowBuilder().addComponents(
            ...group.map((t, i) => new ButtonBuilder()
                .setCustomId(`memetemplate_pick_${t.id}`)
                .setLabel(`${i + 1}. ${t.name}`.slice(0, 80))
                .setStyle(ButtonStyle.Secondary)),
        ));

        return reply(ctx, ui.payload({
            category: 'diversión',
            icon: '🎭',
            kicker: 'Catálogo de memes',
            title: `${picked.length} plantillas para usar`,
            description: 'Elegí una con los botones y te paso el meme en blanco con sus textos.',
            lists: [{
                title: 'Cómo usarlas',
                items: [
                    '`/memegen plantilla:<nombre> arriba:<texto> abajo:<texto>`',
                    'Sin argumentos, `/memegen` elige una al azar.',
                ],
            }],
            media: picked.map(t => ({ url: t.url, description: t.name })),
            rows,
        }));
    },
};

/** Muestra `n` elementos al azar, repartidos a lo largo de la lista. */
function sample(list, n) {
    if (list.length <= n) return list.slice();
    const step = list.length / n;
    const out = [];
    for (let i = 0; i < n; i++) {
        const idx = Math.floor(i * step + Math.random() * (step * 0.6));
        const item = list[Math.min(list.length - 1, idx)];
        if (item && !out.includes(item)) out.push(item);
    }
    return out;
}

function chunk(arr, size) {
    const out = [];
    for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
    return out;
}
