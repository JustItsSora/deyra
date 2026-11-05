const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serveremojilist')
        .setDescription('Lista los emojis del servidor separados por estáticos y animados'),

    name: 'serveremojilist',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const emojis = ctx.guild.emojis.cache;
        if (emojis.size === 0) {
            return reply(ctx, infoPanel('Emojis del servidor', 'Este servidor no tiene emojis personalizados.'));
        }

        const staticEmojis = emojis.filter(e => !e.animated);
        const animatedEmojis = emojis.filter(e => e.animated);

        const lines = [];
        if (staticEmojis.size > 0) lines.push('**Estáticos:**', staticEmojis.map(e => e.toString()).join(' '));
        if (animatedEmojis.size > 0) lines.push('', '**Animados:**', animatedEmojis.map(e => e.toString()).join(' '));

        return reply(ctx, infoPanel(`Emojis del servidor (${emojis.size})`, undefined, { lines }));
    },
};
