const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wouldwin')
        .setDescription('Decide quién ganaría en una batalla hipotética (al azar)')
        .addStringOption(o => o.setName('opcion1').setDescription('Primera opción').setRequired(true))
        .addStringOption(o => o.setName('opcion2').setDescription('Segunda opción').setRequired(true)),

    name: 'wouldwin',
    aliases: ['quiengana'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let a, b;
        if (isSlash(ctx)) {
            a = ctx.options.getString('opcion1');
            b = ctx.options.getString('opcion2');
        } else {
            [a, b] = args.join(' ').split(',').map(s => s?.trim());
        }

        if (!a || !b) {
            return reply(ctx, { ...errorPanel('Faltan opciones', 'Especifica dos opciones a comparar.'), ephemeral: true });
        }

        const winner = Math.random() < 0.5 ? a : b;
        const percent = Math.floor(Math.random() * 30) + 55;

        return reply(ctx, infoPanel('⚔️ ¿Quién ganaría?', `**${a}** vs **${b}**\n\n🏆 **${winner}** ganaría con un ${percent}% de probabilidad.`));
    },
};
