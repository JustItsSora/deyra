const { MessageFlags } = require('discord.js');
// src/gateway/interactions/guessthecolorHandler.js
module.exports = {
    async handle(interaction) {
        const isCorrect = interaction.customId.startsWith('guessthecolor_correct_');
        return interaction.reply({
            content: isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto.',
            flags: MessageFlags.Ephemeral,
        }).catch(() => {});
    },
};
