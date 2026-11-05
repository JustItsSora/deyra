// src/lib/helpView.js
// Construye la vista de /help.
//
// Requisitos queparition解決 este panel:
//   · 500+ comandos: tiene que paginar, no volcar 219 nombres en un bloque.
//   · Cada comando con su descripción real (la que el usuario ya ve en el
//     autocompletado de Discord), no solo el nombre.
//   · Que se pueda saltar directo a una categoría sin pasar por el menú.
//   · Que el color del panel siga a la categoría, igual que el resto del bot.
//
// La lista se arma con columnas de ancho fijo dentro de un bloque de código:
// Discord dibuja el texto normal en fuente proporcional, así que "alinear con
// espacios" fuera de un ``` no funciona. Dentro sí.

const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, MessageFlags,
} = require('discord.js');
const theme = require('./ui/theme');
const text = require('./ui/text');
const config = require('../config');

const CATEGORY_LABELS = theme.CATEGORY_LABELS;

const COMMANDS_PER_PAGE = 9;

function categorySelectRow(categories, selected) {
    const menu = new StringSelectMenuBuilder()
        .setCustomId('help_category')
        .setPlaceholder('📂 Ver otra categoría')
        .addOptions(categories.slice(0, 25).map((cat) => ({
            label: CATEGORY_LABELS[cat] || cat,
            value: cat,
            default: cat === selected,
        })));

    return new ActionRowBuilder().addComponents(menu);
}

function paginationRow(category, page, totalPages) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId(`help_page_${category}_${page - 1}`).setLabel('◀').setStyle(ButtonStyle.Secondary).setDisabled(page <= 0),
        new ButtonBuilder().setCustomId(`help_page_${category}_${page}`).setLabel(`${page + 1}/${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
        new ButtonBuilder().setCustomId(`help_page_${category}_${page + 1}`).setLabel('▶').setStyle(ButtonStyle.Secondary).setDisabled(page >= totalPages - 1),
    );
}

/**
 * Arma la página de una categoría.
 * @param {Record<string, any[]>} byCategory
 * @param {string[]} categories
 * @param {string} category
 * @param {number} [page]
 * @param {{query?: string}} [ctx]
 * @returns {{components: ContainerBuilder[], flags: number}}
 */
function buildCategoryPage(byCategory, categories, category, page = 0, { query } = {}) {
    const commands = (byCategory[category] || [])
        .slice()
        .sort((a, b) => a.data.name.localeCompare(b.data.name));

    const totalPages = Math.max(1, Math.ceil(commands.length / COMMANDS_PER_PAGE));
    const safePage = Math.min(Math.max(page, 0), totalPages - 1);
    const start = safePage * COMMANDS_PER_PAGE;
    const pageCommands = commands.slice(start, start + COMMANDS_PER_PAGE);

    const label = CATEGORY_LABELS[category] || category;
    const accent = theme.accentFor({ category });
    const container = new ContainerBuilder().setAccentColor(accent);

    container.addTextDisplayComponents(
        new TextDisplayBuilder().setContent(`## ${label}`),
    );
    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    );

    if (!pageCommands.length) {
        container.addTextDisplayComponents(
            new TextDisplayBuilder().setContent('No hay comandos en esta categoría todavía.'),
        );
    } else {
        // Dos columnas: comando a la izquierda, descripción a la derecha.
        // El ancho de la columna izquierda se calcula con el nombre más largo
        // de la página, no con un número fijo, así no queda ni un hueco
        // enorme ni un nombre cortado.
        const nameW = Math.max(
            ...pageCommands.map(c => text.width(`/${c.data.name}`.replace('\u200b', ''))),
        );
        const descMax = Math.max(18, 44 - nameW);

        const rows = pageCommands.map((cmd) => {
            const name = text.pad(text.truncate(`/${cmd.data.name}`, nameW), nameW);
            const desc = text.truncate(cmd.data.description || 'Sin descripción.', descMax);
            return `${name}  ${desc}`;
        });

        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(text.code(rows.join('\n'))));

        // Los comandos que son solo prefijo (no entran en el registro de slash
        // por el límite de Discord) se marcan, porque si no el usuario tipea
        // "/comando" en Discord y no le aparece nada.
        const prefixOnly = pageCommands.filter(c => c.__prefixOnly);
        if (prefixOnly.length) {
            container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
                `-# ${prefixOnly.length} de esta página usan solo prefijo: \`${config.PREFIX}${prefixOnly[0].data.name}\`` +
                `${prefixOnly.length > 1 ? ` (y ${prefixOnly.length - 1} más)` : ''}. Discord limita cuántos slash commands se pueden registrar.`,
            ));
        }
    }

    container.addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true),
    );
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
        `-# ${commands.length} comandos en esta categoría · ${safePage * COMMANDS_PER_PAGE + 1}-${Math.min(start + COMMANDS_PER_PAGE, commands.length)} de ${commands.length}`,
    ));

    if (totalPages > 1) {
        container.addActionRowComponents(paginationRow(category, safePage, totalPages));
    }
    container.addActionRowComponents(categorySelectRow(categories, category));

    return { components: [container], flags: MessageFlags.IsComponentsV2 };
}

module.exports = { CATEGORY_LABELS, buildCategoryPage, COMMANDS_PER_PAGE };
