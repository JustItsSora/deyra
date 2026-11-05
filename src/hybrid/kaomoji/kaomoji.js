const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const KAOMOJIS = {
    feliz: '(＾▽＾)', triste: '(╥﹏╥)', enojado: '(╬ಠ益ಠ)', amor: '(♡˃͈ ˂͈♡)',
    confundido: '(・_・?)', sorpresa: '(°o°)', vergüenza: '(⁄ ⁄•⁄ω⁄•⁄ ⁄)', duda: '(¬‿¬)',
    saludo: 'ヽ(・∀・)ﾉ', baile: '♪┏(・o･)┛♪', flip: '(╯°□°）╯︵ ┻━┻', calm: '┬─┬ ノ( ゜-゜ノ)',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kaomoji')
        .setDescription('Muestra un kaomoji (emoticono japonés) según un estado de ánimo')
        .addStringOption(o => o.setName('estado').setDescription('Estado de ánimo').setRequired(true)
            .addChoices(...Object.keys(KAOMOJIS).map(k => ({ name: k, value: k })))),

    name: 'kaomoji',
    aliases: [],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const mood = (isSlash(ctx) ? ctx.options.getString('estado') : args[0])?.toLowerCase();
        const kaomoji = KAOMOJIS[mood];

        if (!kaomoji) {
            return reply(ctx, { ...errorPanel('Estado no encontrado', `Estados disponibles: ${Object.keys(KAOMOJIS).join(', ')}`), ephemeral: true });
        }

        return reply(ctx, infoPanel('Kaomoji', kaomoji));
    },
};
