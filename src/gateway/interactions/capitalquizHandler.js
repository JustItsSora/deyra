const { MessageFlags } = require('discord.js');
// src/gateway/interactions/capitalquizHandler.js
module.exports = {
    async handle(interaction) {
        const isCorrect = interaction.customId.startsWith('capitalquiz_correct_');
        return interaction.reply({
            content: isCorrect ? '✅ ¡Correcto!' : '❌ Incorrecto.',
            flags: MessageFlags.Ephemeral,
        }).catch(() => {});
    },
};
