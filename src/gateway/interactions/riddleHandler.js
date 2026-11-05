const { MessageFlags } = require('discord.js');
// src/gateway/interactions/riddleHandler.js
module.exports = {
    async handle(interaction) {
        const encoded = interaction.customId.replace('riddle_reveal_', '');
        let answer;
        try {
            answer = Buffer.from(encoded, 'base64').toString('utf8');
        } catch {
            answer = 'No pude recuperar la respuesta.';
        }
        return interaction.reply({ content: `💡 Respuesta: **${answer}**`, flags: MessageFlags.Ephemeral}).catch(() => {});
    },
};
