// src/hybrid/filter/subcommands/listar.js
//
// /filter listar — el catálogo de presets.
//
// No pide estar en el canal de voz (es una consulta) y responde efímero: el
// menú tiene 11 presets con descripción, mandarlo al canal suma ruido sin
// aportar. Con `menu` explícito lo manda normal, con botones, para dejar el
// panel ahí y que elijan desde ahí.

const { MessageFlags } = require('discord.js');
const { reply, isSlash } = require('../../../lib/reply');
const { warningPanel, wrap } = require('../../../lib/panel');
const { PRESET_NAMES, activeFilter } = require('../../../music/filters');
const { buildFilterMenu } = require('../../../music/ui/filterMenu');

module.exports = {
    async execute(ctx, args = [], { player } = {}) {
        if (!PRESET_NAMES.length) {
            return reply(ctx, {
                ...warningPanel('Sin filtros', 'No hay presets cargados.'),
                ephemeral: true,
            });
        }

        const menu = buildFilterMenu(player, 0);

        // `menu` explícito: panel con botones en el canal, sin ephemerals.
        if (args[0] === 'menu') {
            return reply(ctx, { components: [menu], flags: MessageFlags.IsComponentsV2 });
        }

        return reply(ctx, { ...wrap([menu]), ephemeral: isSlash(ctx) });
    },
};
