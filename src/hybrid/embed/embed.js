// /embed — genera un embed a partir de JSON.
//
// Reimplementado sobre el sistema de diseño: ahora el resultado se arma con los
// mismos bloques que usa el resto del bot (grillas, tarjetas, barras) en vez de
// un embed plano. El JSON sigue siendo el punto de entrada, así que lo que ya
// usaban sigue funcionando.

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const ui = require('../../lib/ui');

/**
 * Convierte un objeto de embed de Discord en los bloques del panel.
 * Reconoce los campos estándar y, además, inventa atajos:
 *   { "stats": [{label, value}] }  → tarjetas
 *   { "grid": [["k","v"]] }        → grilla alineada
 *   { "meters": [{...}] }          → barras
 *   { "fields": [{name, value}] }  → grilla (así se ven en cualquier editor)
 * @returns {{opts: object, warnings: string[]}}
 */
function toPanelOptions(embed) {
    const warnings = [];
    const opts = {
        category: 'utilidad',
        title: embed.title || undefined,
        icon: embed.icon || '🧩',
        kicker: embed.kicker || 'Embed personalizado',
        description: embed.description || undefined,
    };

    // "color" es un entero de Discord (16711680 = rojo). Se pasa directo al
    // panel; si viene en hex ("#ff0000") se convierte.
    if (embed.color !== undefined && embed.color !== null) {
        const color = typeof embed.color === 'string' && embed.color.startsWith('#')
            ? parseInt(embed.color.slice(1), 16)
            : Number(embed.color);
        if (Number.isInteger(color) && color >= 0 && color <= 0xFFFFFF) {
            opts.accent = color;
        } else {
            warnings.push('`color` inválido: se usó el color por defecto.');
        }
    }

    // fields → grilla
    if (Array.isArray(embed.fields) && embed.fields.length) {
        const rows = embed.fields.map((f, i) => {
            if (Array.isArray(f)) return [f[0], f[1]];
            if (!f?.name && !f?.value) {
                warnings.push(`Campo ${i + 1} ignorado: no tiene "name" ni "value".`);
                return null;
            }
            return [f.name || '—', String(f.value ?? '')];
        }).filter(Boolean);
        if (rows.length) opts.grid = rows;
    }

    // Atajos propios del bot
    if (Array.isArray(embed.grid) && embed.grid.length) opts.grid = opts.grid || embed.grid;
    if (Array.isArray(embed.stats) && embed.stats.length) opts.stats = embed.stats.slice(0, 6);
    if (Array.isArray(embed.meters) && embed.meters.length) opts.meters = embed.meters;

    if (Array.isArray(embed.list) && embed.list.length) {
        opts.lists = [{ title: embed.listTitle || 'Lista', items: embed.list.slice(0, 12) }];
    }
    if (embed.callout) opts.callouts = [{ tone: 'muted', text: embed.callout }];

    // image / thumbnail → media. Solo se usa la image: el panel ya tiene su
    // propia miniatura y poner dos imágenes en paralelo se ve raro.
    if (embed.image && /^https?:\/\//i.test(embed.image)) {
        opts.media = { url: embed.image, description: embed.imageAlt };
    }

    if (embed.footer) opts.footerText = embed.footer;
    if (embed.url) opts.callouts = [...(opts.callouts || []), { tone: 'info', text: `<${embed.url}>` }];

    return { opts, warnings };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('embed')
        .setDescription('Genera un embed a partir de un JSON')
        .addStringOption(o => o
            .setName('json')
            .setDescription('El embed en formato JSON')
            .setRequired(true)),

    name: 'embed',
    aliases: ['jsonembed', 'crearembed'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('json') : args.join(' ');
        if (!raw) {
            return reply(ctx, ui.missingArgument('Falta el JSON', 'Pasame el embed en formato JSON.', { usage: '/embed {"title":"Hola"}' }));
        }

        let parsed;
        try {
            parsed = JSON.parse(raw);
        } catch (err) {
            return reply(ctx, ui.error(
                'JSON inválido',
                `No pude parsearlo: \`${ui.truncate(err.message, 120)}\``,
                { hint: 'Probá con algo simple: `{"title":"Hola","description":"Mundo"}`', ephemeral: true },
            ));
        }

        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
            return reply(ctx, ui.missingArgument('Formato incorrecto', 'El JSON tiene que ser un objeto, no una lista ni un valor suelto.'));
        }

        const { opts, warnings } = toPanelOptions(parsed);

        if (!opts.title && !opts.description && !opts.grid && !opts.stats) {
            return reply(ctx, ui.missingArgument(
                'El embed está vacío',
                'Poné al menos un `title`, un `description` o un `grid`.',
                { usage: '{"title":"Hola","description":"Mundo"}' },
            ));
        }

        const payload = ui.payload(opts);
        if (warnings.length) {
            payload.components[0].spliceComponents(
                0, 0,
                new (require('discord.js').TextDisplayBuilder)().setContent(`-# ${warnings.join(' ')}`),
            );
        }

        return reply(ctx, payload);
    },
};

module.exports.toPanelOptions = toPanelOptions;
