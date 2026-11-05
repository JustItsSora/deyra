const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const { getDeleted } = require('../../lib/snipeStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('snipe')
        .setDescription('Muestra el último mensaje eliminado en este canal'),

    name: 'snipe',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const deleted = getDeleted(ctx.channel.id);
        if (!deleted) {
            return reply(ctx, { ...errorPanel('Nada que mostrar', 'No hay mensajes eliminados recientemente en este canal.'), ephemeral: true });
        }

        const secondsAgo = Math.floor((Date.now() - deleted.timestamp) / 1000);
        return reply(ctx, infoPanel(`Mensaje eliminado (hace ${secondsAgo}s)`, `**${deleted.authorTag}:** ${deleted.content}`));
    },
};
