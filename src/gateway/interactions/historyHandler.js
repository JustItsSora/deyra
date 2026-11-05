// src/gateway/interactions/historyHandler.js
//
// Paginación de /history.
//
// Va en el dispatcher global (customId "history_page_...") y no en un collector
// por respuesta, como el resto de la paginación nueva. El motivo es el mismo de
// siempre: el collector moría a los 30 segundos y el panel quedaba con botones
// que no hacían nada.
//
// A diferencia de /favourites, acá el alcance va en el customId y NO se valida
// contra el usuario: el historial del servidor es público por definición (lo
// generó el bot en un canal donde todos escuchan) y el propio lo muestra con
// `--server`. Lo que no se permite es paginar el historial de otra persona,
// porque ese nunca se genera: siempre es el del que aprieta.

const { getUserHistory, getGuildHistory } = require('../../music/lib/history');

module.exports = {
    async handle(interaction) {
        const parts = interaction.customId.split('_');
        const scope = parts[2] === 'server' ? 'server' : 'user';
        const page = Math.max(0, parseInt(parts[3], 10) || 0);

        const rows = scope === 'server'
            ? await getGuildHistory(interaction.guildId, 500)
            : await getUserHistory(interaction.user.id, 500);

        if (!rows.length) {
            return interaction.reply({
                content: 'El historial está vacío.',
                flags: 64,
            }).catch(() => {});
        }

        const { buildPanel, PER_PAGE } = require('../../hybrid/history/history');
        const pageCount = Math.max(1, Math.ceil(rows.length / PER_PAGE));
        const safePage = Math.min(page, pageCount - 1);

        return interaction.update(buildPanel(
            rows.slice(safePage * PER_PAGE, (safePage + 1) * PER_PAGE),
            {
                page: safePage,
                total: rows.length,
                pageCount,
                scope,
                title: scope === 'server' ? 'Reproducidas en el server' : 'Tu historial',
            },
        )).catch(() => {});
    },
};
