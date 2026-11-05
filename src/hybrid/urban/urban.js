// /urban — definición de Urban Dictionary.
// La API devuelve markdown con corchetes como enlaces [texto] y corchetes sueltos
// como glosas [lo que sea]. Hay que limpiarlos o Discord los interpreta como
// links rotos y el panel se ve roto.

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { urbanDefine } = require('../../lib/api/lookupApi');
const ui = require('../../lib/ui');

/** Saca el markdown de la API y deja el texto presentable. */
function clean(text) {
    return String(text || '')
        .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1') // [texto](url) → texto
        .replace(/\[([^\]]*)\]/g, '$1')           // [glosa] → glosa
        .replace(/\s{2,}/g, ' ')
        .trim();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('urban')
        .setDescription('Busca una palabra en Urban Dictionary')
        .addStringOption(o => o
            .setName('palabra')
            .setDescription('La palabra a definir')
            .setRequired(true)),

    name: 'urban',
    aliases: ['ud', 'urbandictionary', 'significa'],
    category: 'diversión',
    cooldownMs: 5000,

    async autocomplete(interaction) {
        const focused = interaction.options.getFocused();
        if (!focused) return interaction.respond([]).catch(() => {});
        // No hay API de autocomplete: se offered el texto del usuario tal cual.
        return interaction.respond([{ name: `Buscar "${focused.value}"`, value: focused.value }]).catch(() => {});
    },

    async execute(ctx, args = []) {
        const term = isSlash(ctx) ? ctx.options.getString('palabra') : args.join(' ');
        if (!term) {
            return reply(ctx, ui.missingArgument('Falta la palabra', '¿Qué palabra querés que busque?', { usage: '/urban bot' }));
        }

        let result;
        try {
            result = await urbanDefine(term);
        } catch (err) {
            if (err.notFound) {
                return reply(ctx, ui.empty(
                    'Sin definiciones',
                    `Urban Dictionary no tiene nada para **${ui.truncate(term, 40)}**.`,
                    { hint: 'Probá en inglés.' },
                ));
            }
            console.error('[urban] Error:', err.message);
            return reply(ctx, ui.error('No pude consultar Urban Dictionary', 'La API no respondió.', { ephemeral: true }));
        }

        const definitions = result.definitions
            .map((d, i) => ({ ...d, index: i + 1 }))
            .map(d => `**${d.index}.** ${ui.truncate(clean(d.text), 320)}${d.example ? `\n> ${ui.truncate(clean(d.example), 160)}` : ''}`);

        return reply(ctx, ui.payload({
            category: 'diversión',
            icon: '📖',
            kicker: 'Urban Dictionary',
            title: result.word,
            lists: [{ title: 'Definiciones', items: definitions, ordered: true }],
            grid: result.definitions.map((d, i) => [`#${i + 1} likes`, `👍 ${ui.compact(d.likes || 0)}`]),
            callouts: [{ tone: 'warning', text: 'Las definiciones las escriben los usuarios: pueden contener groserías.' }],
            footerText: 'Fuente: Urban Dictionary',
        }));
    },
};

module.exports.clean = clean;
