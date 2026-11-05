// src/gateway/interactions/memetemplateHandler.js
// customId: "memetemplate_pick_<id>" → muestra esa plantilla en blanco.

const { templateById } = require('../../lib/api/memeApi');
const ui = require('../../lib/ui');

module.exports = {
    async handle(interaction) {
        const id = (interaction.customId || '').split('_')[2];
        if (!id) return;

        const template = await templateById(id).catch(() => null);
        if (!template) {
            return interaction.reply({
                ...ui.empty('Plantilla no encontrada', 'Ese meme ya no está en el catálogo. Probá `/memetemplate` de nuevo.', { ephemeral: true }),
            }).catch(() => {});
        }

        return interaction.update({
            ...ui.imagePayload({
                category: 'diversión',
                icon: '🎭',
                kicker: 'Plantilla elegida',
                title: template.name,
                caption: `Plantilla con **${template.boxes}** ${template.boxes === 1 ? 'caja de texto' : 'cajas de texto'}. Usala con \`/memegen\`.`,
                media: { url: template.url, description: template.name },
                source: 'imgflip',
                sourceUrl: `https://imgflip.com/memes/${template.name}`,
            }),
        }).catch(() => {});
    },
};
