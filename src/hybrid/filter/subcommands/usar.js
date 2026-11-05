// src/hybrid/filter/subcommands/usar.js
//
// /filter usar <filtro> — aplica un preset de audio.
//
// Dos casos que se responden con un error claro en vez de un "no se encontró":
//
//   · El player está en pausa. Lavalink acepta el cambio pero no se escucha
//     hasta reanudar, y el panel iba a decir que el filtro está activo cuando
//     todavía no suena. Mejor avisar y que el usuario reanude.
//   · El preset no existe. El autocomplete ya evita casi siempre esto, pero el
//     comando de texto no pasa por autocomplete.

const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel, warningPanel } = require('../../../lib/panel');
const { applyFilter, isPreset, describe, PRESET_NAMES } = require('../../../music/filters');

module.exports = {
    async execute(ctx, args = [], { player, name } = {}) {
        const raw = String(name || '').trim().toLowerCase();

        if (!raw) {
            return reply(ctx, {
                ...warningPanel('Falta el filtro', `Uso: \`/filter usar <filtro>\`\nDisponibles: ${PRESET_NAMES.join(', ')}`),
                ephemeral: true,
            });
        }

        if (!isPreset(raw)) {
            return reply(ctx, {
                ...errorPanel('No existe ese filtro', `No conozco un filtro llamado \`${raw}\`.\nDisponibles: ${PRESET_NAMES.join(', ')}`),
                ephemeral: true,
            });
        }

        if (player.paused) {
            return reply(ctx, {
                ...warningPanel('Está en pausa', 'Reanudá la música y aplicá el filtro: Lavalink no cambia el audio de una pista en pausa.'),
                ephemeral: true,
            });
        }

        const result = await applyFilter(player, raw);
        if (!result.ok) {
            return reply(ctx, {
                ...errorPanel('No se pudo aplicar', `El nodo de música rechazó el filtro: ${result.error}`),
                ephemeral: true,
            });
        }

        const info = describe(raw);
        const also = info.hasSpeed ? ' También cambia la velocidad.' : '';

        return reply(ctx, successPanel(
            `${info.label} activado`,
            `${info.description}${also}`,
            { lines: ['El filtro se reaplica solo en cada canción nueva.'] },
        ));
    },
};
