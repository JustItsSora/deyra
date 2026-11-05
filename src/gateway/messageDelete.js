const { recordDeleted } = require('../lib/snipeStore');

module.exports = {
    name: 'messageDelete',
    async execute(message) {
        if (!message.guild || message.author?.bot) return;
        if (!message.content && message.attachments.size === 0) return;

        recordDeleted(message.channel.id, {
            content: message.content || '*(sin contenido de texto, posiblemente un adjunto)*',
            authorTag: message.author?.tag || 'Desconocido',
            authorAvatar: message.author?.displayAvatarURL?.() || null,
            timestamp: Date.now(),
        });
    },
};
