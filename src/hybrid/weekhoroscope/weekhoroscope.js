const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const PREDICTIONS = [
    'Esta semana trae oportunidades inesperadas en tu vida social.',
    'Es un buen momento para enfocarte en proyectos personales.',
    'Las relaciones cercanas se fortalecerán esta semana.',
    'Podrías recibir buenas noticias relacionadas con el trabajo o estudio.',
    'Es momento de descansar y recargar energías.',
    'Una decisión importante se aclarará esta semana.',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('weekhoroscope')
        .setDescription('Muestra tu horóscopo semanal según tu signo')
        .addStringOption(o => o.setName('signo').setDescription('Tu signo zodiacal').setRequired(true)),

    name: 'weekhoroscope',
    aliases: ['horoscoposemanal'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const sign = isSlash(ctx) ? ctx.options.getString('signo') : args.join(' ');
        if (!sign) {
            return reply(ctx, { ...errorPanel('Falta el signo', 'Especifica tu signo zodiacal.'), ephemeral: true });
        }

        const prediction = PREDICTIONS[Math.floor(Math.random() * PREDICTIONS.length)];
        return reply(ctx, infoPanel(`🔮 Horóscopo semanal — ${sign}`, prediction));
    },
};
