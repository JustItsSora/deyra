// src/gateway/interactions/gifHandler.js
// customId: "gif_pick_<categoría>" → ejecuta /gif con esa categoría.
// Son los botones de sugerencias del comando /gif cuando la búsqueda falla.

const { getActionGif, DISPLAY_NAMES } = require('../../lib/gifApi');
const ui = require('../../lib/ui');

module.exports = {
    async handle(interaction) {
        const category = (interaction.customId || '').split('_')[2];
        if (!category) return;

        let gif;
        try {
            gif = await getActionGif(category);
        } catch (err) {
            console.error(`[gif-pick] "${category}":`, err.message);
            return interaction.reply({
                ...ui.error('No pude obtener el GIF', 'La fuente no respondió. Probá de nuevo en unos segundos.', { ephemeral: true }),
            }).catch(() => {});
        }

        return interaction.update({
            ...ui.imagePayload({
                category: 'diversión',
                icon: '🎞️',
                kicker: 'Resultado de búsqueda',
                title: DISPLAY_NAMES[category] || category,
                caption: `Busqué **${category}** y encontré esto.`,
                media: { url: gif.url, description: gif.anime || null },
                source: gif.source,
                author: gif.anime || undefined,
                footerText: `Categoría: \`${category}\``,
            }),
        }).catch(() => {});
    },
};
