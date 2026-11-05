const { recordEdited } = require('../lib/snipeStore');

module.exports = {
    name: 'messageUpdate',
    async execute(oldMessage, newMessage) {
        if (!newMessage.guild || newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return; // ediciones sin cambio de texto (embeds, etc.)

        recordEdited(newMessage.channel.id, {
            before: oldMessage.content || '*(vacío)*',
            after: newMessage.content || '*(vacío)*',
            authorTag: newMessage.author?.tag || 'Desconocido',
            authorAvatar: newMessage.author?.displayAvatarURL?.() || null,
            timestamp: Date.now(),
        });
    },
};
