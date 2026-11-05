// src/gateway/interactions/marryHandler.js
const { buildPanel } = require('../../lib/panel');
const { MessageFlags } = require('discord.js');

module.exports = {
    async handle(interaction) {
        const [, decision, fromId, toId] = interaction.customId.split('_');

        if (interaction.user.id !== toId) {
            return interaction.reply({ content: 'Solo la persona a quien le propusieron matrimonio puede responder.', flags: MessageFlags.Ephemeral}).catch(() => {});
        }

        const accepted = decision === 'accept';
        const panel = buildPanel({
            title: accepted ? '💍 ¡Felicidades!' : '💔 Propuesta rechazada',
            description: accepted
                ? `<@${toId}> aceptó casarse con <@${fromId}>! 🎉`
                : `<@${toId}> rechazó la propuesta de <@${fromId}>.`,
            tone: accepted ? 'success' : 'error',
        });

        return interaction.update({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    },
};
