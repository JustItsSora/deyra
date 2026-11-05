// src/lib/joinWelcomePanel.js
// Arma el panel Components V2 que se manda cuando Deyra se une a un
// servidor: intro + explicación de features en el idioma elegido, con un
// selector para cambiar de idioma sin perder el resto del panel.

const {
    ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, SeparatorSpacingSize,
    ActionRowBuilder, StringSelectMenuBuilder,
} = require('discord.js');
const config = require('../config');
const { getLocales, LANGUAGE_ORDER } = require('../data/joinWelcomeLocales');

function languageSelectRow(selectedLang) {
    const locales = getLocales();
    const menu = new StringSelectMenuBuilder()
        .setCustomId('joinlang_select')
        .setPlaceholder(locales[selectedLang]?.selectPlaceholder || 'Choose a language')
        .addOptions(LANGUAGE_ORDER.map((code) => ({
            label: locales[code].label,
            value: code,
            emoji: locales[code].flag,
            default: code === selectedLang,
        })));

    return new ActionRowBuilder().addComponents(menu);
}

/**
 * @param {string} lang - código del idioma (debe existir en LANGUAGE_ORDER).
 */
function buildJoinWelcomePanel(lang = 'es') {
    const locales = getLocales();
    const t = locales[lang] || locales.es;

    const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${t.title}`));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(t.intro));

    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`### ${t.featuresTitle}`));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(t.features.join('\n')));

    container.addSeparatorComponents(new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small).setDivider(true));

    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(t.help));
    container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`-# ${t.footer}`));

    container.addActionRowComponents(languageSelectRow(lang));

    return container;
}

module.exports = { buildJoinWelcomePanel, languageSelectRow };
