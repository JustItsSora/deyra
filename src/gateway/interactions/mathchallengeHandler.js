const { MessageFlags } = require('discord.js');
// src/gateway/interactions/mathchallengeHandler.js
module.exports = {
    async handle(interaction) {
        const isCorrect = interaction.customId.startsWith('mathchallenge_correct_');
        return interaction.reply({
            content: isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto.',
            flags: MessageFlags.Ephemeral,
        }).catch(() => {});
    },
};
