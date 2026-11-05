const { MessageFlags } = require('discord.js');
// src/gateway/interactions/flagquizHandler.js
module.exports = {
    async handle(interaction) {
        const isCorrect = interaction.customId.startsWith('flagquiz_correct_');
        return interaction.reply({
            content: isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto.',
            flags: MessageFlags.Ephemeral,
        }).catch(() => {});
    },
};
