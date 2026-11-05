const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const CARDS = [
    { name: 'El Loco', meaning: 'nuevos comienzos, espontaneidad, un salto de fe' },
    { name: 'El Mago', meaning: 'manifestación, ingenio, poder personal' },
    { name: 'La Sacerdotisa', meaning: 'intuición, misterio, sabiduría interior' },
    { name: 'La Emperatriz', meaning: 'abundancia, fertilidad, naturaleza' },
    { name: 'El Emperador', meaning: 'autoridad, estructura, control' },
    { name: 'La Torre', meaning: 'cambio repentino, revelación, caos' },
    { name: 'La Estrella', meaning: 'esperanza, inspiración, renovación' },
    { name: 'La Luna', meaning: 'ilusión, miedo, subconsciente' },
    { name: 'El Sol', meaning: 'alegría, éxito, vitalidad' },
    { name: 'La Rueda de la Fortuna', meaning: 'ciclos, destino, cambios de suerte' },
    { name: 'La Muerte', meaning: 'transformación, final de una etapa, cambio' },
    { name: 'El Diablo', meaning: 'ataduras, tentación, materialismo' },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tarot')
        .setDescription('Extrae una carta de tarot aleatoria'),

    name: 'tarot',
    aliases: [],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        const card = CARDS[Math.floor(Math.random() * CARDS.length)];
        const reversed = Math.random() < 0.3;

        return reply(ctx, infoPanel(
            `🔮 ${card.name}${reversed ? ' (Invertida)' : ''}`,
            reversed ? `Significado invertido: bloqueo o exceso relacionado con ${card.meaning}.` : `Significado: ${card.meaning}.`,
        ));
    },
};
