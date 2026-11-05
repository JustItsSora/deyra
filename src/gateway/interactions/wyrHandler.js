const { MessageFlags } = require('discord.js');
// src/gateway/interactions/wyrHandler.js
module.exports = {
    async handle(interaction) {
        const choice = interaction.customId === 'wyr_a' ? 'A' : 'B';
        return interaction.reply({ content: `Votaste por la opción **${choice}**.`, flags: MessageFlags.Ephemeral}).catch(() => {});
    },
};
