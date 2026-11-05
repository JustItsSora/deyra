// src/gateway/interactions/suggestHandler.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { buildPanel } = require('../../lib/panel');
const { Suggestion } = require('../../data/models');

module.exports = {
    async handle(interaction) {
        const isUp = interaction.customId === 'suggest_up';
        const suggestion = await Suggestion.findOne({ where: { messageId: interaction.message.id } });
        if (!suggestion) {
            return interaction.reply({ content: 'No pude encontrar esta sugerencia en la base de datos.', flags: MessageFlags.Ephemeral}).catch(() => {});
        }

        if (isUp) suggestion.upvotes += 1;
        else suggestion.downvotes += 1;
        await suggestion.save();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('suggest_up').setLabel(String(suggestion.upvotes)).setStyle(ButtonStyle.Success).setEmoji('👍'),
            new ButtonBuilder().setCustomId('suggest_down').setLabel(String(suggestion.downvotes)).setStyle(ButtonStyle.Danger).setEmoji('👎'),
        );

        const panel = buildPanel({
            title: '💡 Nueva sugerencia',
            description: `${suggestion.content}\n\n-# Sugerido por <@${suggestion.authorId}>`,
            tone: 'primary',
            rows: [row],
        });

        return interaction.update({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    },
};
