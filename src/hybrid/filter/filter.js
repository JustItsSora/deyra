// src/hybrid/filter/filter.js
//
// Filtros de audio (ecualizador, nightcore, 8D, bassboost...). Es el módulo
// que más falta le hacía a Deyra: hasta ahora el único filtro del bot era
// /speed, y en los servidores grandes esto es lo primero que se pide.
//
// Puerto del /filter del bot de música viejo (OpenUwU / Eleven Music,
// OUSL-1.0), con tres diferencias:
//
//   1. Los presets se aplican sobre Kazagumo (player.shoukaku.setFilters) en
//      vez de sobre su wrapper propio. Ver src/music/filters/index.js.
//   2. El menú de Eleven era un collector de 5 minutos por comando, así que el
//      panel moría a los 5 minutos aunque la canción siguiera sonando. Acá los
//      botones son PERSISTENTES (los maneja src/gateway/interactions/musicHandler.js)
//      y no expiran mientras el player siga vivo.
//   3. Sin emojis del servidor del autor: los iconos salen de src/lib/emojis.js.
//
// Los subcomandos hacen sus propios `require` (no reexportamos nada desde acá):
// los helpers que necesitan ya son públicos y cada uno importa lo suyo.

const { SlashCommandBuilder } = require('discord.js');
const { isSlash, getMember } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { reply } = require('../../lib/reply');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');
const { PRESET_NAMES } = require('../../music/filters');
const { fairplayAllows } = require('../../music/lib/musicConfig');

const VALID_SUBS = ['usar', 'quitar', 'listar', 'set', 'clear', 'list'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('filter')
        .setDescription('Aplica filtros de audio al reproductor de música')
        .addSubcommand(s => s.setName('usar')
            .setDescription('Activa un filtro de audio')
            .addStringOption(o => o.setName('filtro')
                .setDescription('Qué filtro querés usar')
                .setRequired(true)
                .setAutocomplete(true)))
        .addSubcommand(s => s.setName('quitar')
            .setDescription('Quita el filtro de audio activo'))
        .addSubcommand(s => s.setName('listar')
            .setDescription('Muestra todos los filtros disponibles')),

    name: 'filter',
    aliases: ['eq', 'equalizer', 'filtros'],
    category: 'música',
    cooldownMs: 2000,

    /** Autocomplete de presets: `/filter usar nightc…` completa solo. */
    async autocomplete(interaction) {
        const focused = interaction.options.getFocused().toLowerCase();
        const matches = focused
            ? PRESET_NAMES.filter((n) => n.includes(focused))
            : PRESET_NAMES;

        await interaction.respond(matches.slice(0, 25).map((name) => ({ name, value: name })))
            .catch(() => {});
    },

    async execute(ctx, args = []) {
        if (!requireMusic(ctx)) return;

        // Sin argumentos, `listar` es lo útil: mostrar el menú de presets.
        const raw = isSlash(ctx) ? ctx.options.getSubcommand() : (args[0]?.toLowerCase() || 'listar');
        const subcommand = VALID_SUBS.includes(raw) ? raw : 'listar';

        const player = requirePlayer(ctx);
        if (!player) return;

        // `listar` es de consulta: no tiene sentido exigir estar en el canal de
        // voz para ver qué filtros hay. El resto sí son controles en vivo.
        if (subcommand === 'listar') {
            return require('./subcommands/listar').execute(ctx, args.slice(1), { player });
        }

        // Fairplay: si el server lo activó, solo los del rol tocan la música.
        if (!fairplayAllows(getMember(ctx), player)) {
            return reply(ctx, {
                ...errorPanel('Fairplay activo', 'En este servidor la música solo se controla con el rol autorizado.'),
                ephemeral: true,
            });
        }

        if (!requireSameVoiceChannel(ctx, player)) return;

        if (subcommand === 'usar' || subcommand === 'set') {
            const name = isSlash(ctx)
                ? ctx.options.getString('filtro')
                : args.slice(1).join(' ').toLowerCase().trim();
            return require('./subcommands/usar').execute(ctx, args.slice(1), { player, name });
        }

        return require('./subcommands/quitar').execute(ctx, args.slice(1), { player });
    },
};
