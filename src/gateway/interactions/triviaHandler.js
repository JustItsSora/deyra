const { MessageFlags } = require('discord.js');
// src/gateway/interactions/triviaHandler.js
module.exports = {
    async handle(interaction) {
        const isCorrect = interaction.customId.startsWith('trivia_correct_');

        await interaction.reply({
            content: isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto.',
            flags: MessageFlags.Ephemeral,
        }).catch(() => {});
    },
};
