const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojicount')
        .setDescription('Muestra cuántos emojis tiene el servidor (estáticos y animados)'),

    name: 'emojicount',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const emojis = ctx.guild.emojis.cache;
        const animated = emojis.filter(e => e.animated).size;
        const staticCount = emojis.size - animated;

        return reply(ctx, infoPanel('Conteo de emojis', undefined, {
            lines: [`**Total:** ${emojis.size}`, `**Estáticos:** ${staticCount}`, `**Animados:** ${animated}`],
        }));
    },
};
