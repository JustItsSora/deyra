// src/gateway/interactions/helpHandler.js
// Botones y selector de /help. Toda la lógica de armado vive en helpView.js;
// este archivo solo enruta el customId y actualiza el mensaje.

const { buildCategoryPage } = require('../../lib/helpView');
const ui = require('../../lib/ui');
const { MessageFlags } = require('discord.js');

function collectByCategory(client) {
    const byCategory = {};
    for (const command of client.commands.values()) {
        const cat = command.category || 'utilidad';
        if (!byCategory[cat]) byCategory[cat] = [];
        byCategory[cat].push(command);
    }
    return byCategory;
}

module.exports = {
    async handle(interaction) {
        const client = interaction.client;

        // Selector de categoría (menú desplegable).
        if (interaction.isStringSelectMenu() && interaction.customId === 'help_category') {
            const byCategory = collectByCategory(client);
            const categories = Object.keys(byCategory).sort();
            const selected = interaction.values[0];

            if (!byCategory[selected]) {
                return interaction.reply({
                    ...ui.empty('Categoría desconocida', 'Esa categoría ya no existe.'),
                    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                }).catch(() => {});
            }

            return interaction.update(buildCategoryPage(byCategory, categories, selected, 0)).catch(() => {});
        }

        // Botones de paginación: help_page_<categoría>_<página>
        if (interaction.isButton() && interaction.customId.startsWith('help_page_')) {
            const rest = interaction.customId.replace('help_page_', '');
            const lastUnderscore = rest.lastIndexOf('_');
            const category = rest.slice(0, lastUnderscore);
            const page = Math.max(0, parseInt(rest.slice(lastUnderscore + 1), 10) || 0);

            const byCategory = collectByCategory(client);
            const categories = Object.keys(byCategory).sort();

            if (!byCategory[category]) {
                return interaction.reply({
                    ...ui.empty('Categoría desconocida', 'Esa categoría ya no existe.'),
                    flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                }).catch(() => {});
            }

            return interaction.update(buildCategoryPage(byCategory, categories, category, page)).catch(() => {});
        }
    },
};
