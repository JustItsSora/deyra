// src/gateway/interactions/joinlangHandler.js
const { MessageFlags } = require('discord.js');
const { buildJoinWelcomePanel } = require('../../lib/joinWelcomePanel');

module.exports = {
    async handle(interaction) {
        if (!interaction.isStringSelectMenu() || interaction.customId !== 'joinlang_select') return;

        const selectedLang = interaction.values[0];

        try {
            const { GuildConfig } = require('../../data/models');
            const [row] = await GuildConfig.findOrCreate({ where: { guildId: interaction.guild.id }, defaults: { language: selectedLang } });
            row.language = selectedLang;
            await row.save();
        } catch (err) {
            console.error('[joinlangHandler] No se pudo guardar el idioma:', err.message);
        }

        const container = buildJoinWelcomePanel(selectedLang);
        return interaction.update({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    },
};
