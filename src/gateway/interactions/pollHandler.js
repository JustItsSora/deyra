// src/gateway/interactions/pollHandler.js
const { buildPanel } = require('../../lib/panel');
const { MessageFlags } = require('discord.js');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

// messageId -> { question: string, yes: Set<userId>, no: Set<userId> }
const votes = new Map();

module.exports = {
    async handle(interaction) {
        const choice = interaction.customId === 'poll_yes' ? 'yes' : 'no';
        const messageId = interaction.message.id;

        if (!votes.has(messageId)) {
            // Primera interacción con esta encuesta: extraemos la pregunta del texto ya renderizado.
            const rawText = interaction.message.components?.[0]?.components?.[0]?.content || '';
            const question = rawText.replace(/^## 📊 Encuesta\n?/, '') || 'Encuesta';
            votes.set(messageId, { question, yes: new Set(), no: new Set() });
        }
        const record = votes.get(messageId);

        record.yes.delete(interaction.user.id);
        record.no.delete(interaction.user.id);
        record[choice].add(interaction.user.id);

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('poll_yes').setLabel(`Sí (${record.yes.size})`).setStyle(ButtonStyle.Success).setEmoji('✅'),
            new ButtonBuilder().setCustomId('poll_no').setLabel(`No (${record.no.size})`).setStyle(ButtonStyle.Danger).setEmoji('❌'),
        );

        const panel = buildPanel({ title: '📊 Encuesta', description: record.question, tone: 'primary', rows: [row] });
        return interaction.update({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    },
};
