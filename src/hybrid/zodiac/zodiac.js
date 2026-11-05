const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const SIGNS = [
    { name: 'Aries', range: [[3, 21], [4, 19]], emoji: '♈' },
    { name: 'Tauro', range: [[4, 20], [5, 20]], emoji: '♉' },
    { name: 'Géminis', range: [[5, 21], [6, 20]], emoji: '♊' },
    { name: 'Cáncer', range: [[6, 21], [7, 22]], emoji: '♋' },
    { name: 'Leo', range: [[7, 23], [8, 22]], emoji: '♌' },
    { name: 'Virgo', range: [[8, 23], [9, 22]], emoji: '♍' },
    { name: 'Libra', range: [[9, 23], [10, 22]], emoji: '♎' },
    { name: 'Escorpio', range: [[10, 23], [11, 21]], emoji: '♏' },
    { name: 'Sagitario', range: [[11, 22], [12, 21]], emoji: '♐' },
    { name: 'Capricornio', range: [[12, 22], [1, 19]], emoji: '♑' },
    { name: 'Acuario', range: [[1, 20], [2, 18]], emoji: '♒' },
    { name: 'Piscis', range: [[2, 19], [3, 20]], emoji: '♓' },
];

const HOROSCOPES = [
    'Hoy es un buen día para tomar decisiones importantes.',
    'La energía está de tu lado, aprovecha las oportunidades.',
    'Presta atención a lo que dicen las personas cercanas a ti.',
    'Un cambio inesperado traerá buenas noticias.',
    'Es momento de enfocarte en tus metas personales.',
];

function getSign(day, month) {
    return SIGNS.find(s => {
        const [[m1, d1], [m2, d2]] = s.range;
        if (m1 < m2) return (month === m1 && day >= d1) || (month === m2 && day <= d2);
        return (month === m1 && day >= d1) || (month === m2 && day <= d2); // Capricornio cruza año
    }) || SIGNS[0];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('zodiac')
        .setDescription('Muestra tu signo zodiacal y horóscopo del día')
        .addIntegerOption(o => o.setName('dia').setDescription('Día de nacimiento (1-31)').setMinValue(1).setMaxValue(31).setRequired(true))
        .addIntegerOption(o => o.setName('mes').setDescription('Mes de nacimiento (1-12)').setMinValue(1).setMaxValue(12).setRequired(true)),

    name: 'zodiac',
    aliases: ['horoscopo', 'signo'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let day, month;
        if (isSlash(ctx)) {
            day = ctx.options.getInteger('dia');
            month = ctx.options.getInteger('mes');
        } else {
            day = parseInt(args[0], 10);
            month = parseInt(args[1], 10);
        }

        if (!day || !month) {
            return reply(ctx, { ...errorPanel('Fecha inválida', 'Especifica día y mes válidos.'), ephemeral: true });
        }

        const sign = getSign(day, month);
        const horoscope = HOROSCOPES[Math.floor(Math.random() * HOROSCOPES.length)];

        return reply(ctx, infoPanel(`${sign.emoji} ${sign.name}`, horoscope));
    },
};
