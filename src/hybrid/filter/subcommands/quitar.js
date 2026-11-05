// src/hybrid/filter/subcommands/quitar.js
//
// /filter quitar — saca el filtro activo y deja el audio como estaba.

const { reply } = require('../../../lib/reply');
const { successPanel, warningPanel, errorPanel } = require('../../../lib/panel');
const { clearFilter, activeFilter, describe } = require('../../../music/filters');

module.exports = {
    async execute(ctx, args = [], { player } = {}) {
        const active = activeFilter(player);

        if (!active) {
            return reply(ctx, {
                ...warningPanel('No hay ningún filtro', 'El audio ya está sin filtros.'),
                ephemeral: true,
            });
        }

        const result = await clearFilter(player);
        if (!result.ok) {
            return reply(ctx, {
                ...errorPanel('No se pudo quitar', `El nodo de música respondió: ${result.error}`),
                ephemeral: true,
            });
        }

        return reply(ctx, successPanel(
            'Filtro quitado',
            `Se sacó **${describe(active)?.label || active}**. El audio vuelve a su sonido original.`,
        ));
    },
};
