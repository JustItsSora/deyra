const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rate')
        .setDescription('Califica algo del 1 al 10 (de forma determinística y divertida)')
        .addStringOption(o => o.setName('cosa').setDescription('Lo que quieres calificar').setRequired(true)),

    name: 'rate',
    aliases: ['calificar'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const thing = isSlash(ctx) ? ctx.options.getString('cosa') : args.join(' ');
        if (!thing) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica qué quieres calificar.'), ephemeral: true });
        }

        const hash = crypto.createHash('md5').update(thing.toLowerCase()).digest('hex');
        const rating = (parseInt(hash.slice(0, 4), 16) % 101) / 10; // 0.0 - 10.0

        return reply(ctx, infoPanel('⭐ Calificación', `Yo calificaría **"${thing}"** con un **${rating.toFixed(1)}/10**.`));
    },
};
