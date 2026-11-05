const { MessageFlags } = require('discord.js');
// src/gateway/interactions/truefalseHandler.js
module.exports = {
    async handle(interaction) {
        const isCorrect = interaction.customId.startsWith('truefalse_correct_');
        return interaction.reply({
            content: isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto.',
            flags: MessageFlags.Ephemeral,
        }).catch(() => {});
    },
};
