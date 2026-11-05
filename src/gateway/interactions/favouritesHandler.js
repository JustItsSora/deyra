// src/gateway/interactions/favouritesHandler.js
//
// Paginación de /favourites.
//
// Van en el dispatcher global (customId "favs_page_...") y no en un collector
// por respuesta por la misma razón que la música: el panel se quedaba muerto a
// los 30 segundos, que es justo cuando alguien lo estaba usando.
//
// El userId viaja EN el customId a propósito. Sin él, cualquiera podría
// paginar la lista de favoritos de otro. Con él, el handler lo compara con
// quien hizo clic y si no coincide le dice que use su propio comando.

const { MessageFlags } = require('discord.js');
const { warningPanel } = require('../../lib/panel');
const { formatDuration, cleanAuthorName, truncateTitle } = require('../../music/lib/trackFormat');
const fav = require('../../music/lib/favouritesService');

const PER_PAGE = 10;

module.exports = {
    async handle(interaction) {
        const parts = interaction.customId.split('_');
        const ownerId = parts[2];
        const page = Math.max(0, parseInt(parts[3], 10) || 0);

        if (interaction.user.id !== ownerId) {
            return interaction.reply({
                ...warningPanel('Esa lista no es tuya', 'Usá `/favourites` para ver tus propias canciones guardadas.'),
                flags: MessageFlags.Ephemeral,
            }).catch(() => {});
        }

        const { rows, count } = await fav.listFavorites(ownerId, { page, perPage: PER_PAGE });
        if (!count) {
            return interaction.reply({
                ...warningPanel('Ya no tenés favoritas', 'Tu lista quedó vacía.'),
                flags: MessageFlags.Ephemeral,
            }).catch(() => {});
        }

        const pageCount = Math.max(1, Math.ceil(count / PER_PAGE));
        const safePage = Math.min(page, pageCount - 1);
        const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

        const lines = rows.map((row, i) => {
            const n = safePage * PER_PAGE + i + 1;
            return `\`${String(n).padStart(2, ' ')}.\` [${truncateTitle(row.title, 45)}](${row.uri || 'https://youtube.com'}) — ${cleanAuthorName(row.author, 20)} \`${formatDuration(row.length)}\``;
        });

        const nav = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`favs_page_${ownerId}_${Math.max(0, safePage - 1)}`)
                .setEmoji('◀️').setStyle(ButtonStyle.Secondary).setDisabled(safePage === 0),
            new ButtonBuilder()
                .setCustomId(`favs_page_${ownerId}_${Math.min(pageCount - 1, safePage + 1)}`)
                .setEmoji('▶️').setStyle(ButtonStyle.Secondary).setDisabled(safePage >= pageCount - 1),
        );

        return interaction.update({
            ...require('../../lib/panel').successPanel('Tus favoritas', lines.join('\n'), {
                rows: [nav],
                lines: [`**${count}** canción${count === 1 ? '' : 'es'} guardada${count === 1 ? '' : 's'} • página ${safePage + 1} de ${pageCount}`],
            }),
        }).catch(() => {});
    },
};
