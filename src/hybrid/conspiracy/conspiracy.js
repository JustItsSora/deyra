const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

// Generador de teorías absurdas y evidentemente ficticias (palomas-robot, gatos-espía),
// nunca relacionadas con eventos, personas o instituciones reales, para mantenerlo
// como humor inofensivo sin rozar desinformación real.
const SUBJECTS = ['las palomas', 'los gatos', 'los microondas', 'las impresoras', 'los patos de goma', 'las nubes con forma rara', 'los relojes de pared', 'los semáforos'];
const CLAIMS = ['en realidad son robots del gobierno', 'controlan el clima en secreto', 'se comunican en un idioma que solo ellas entienden', 'están coordinando un plan a nivel mundial', 'saben algo que nosotros no', 'fueron creados por una civilización antigua', 'están contando cuántas veces parpadeas al día'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('conspiracy')
        .setDescription('Genera una teoría conspirativa absurda y claramente ficticia, solo por diversión'),

    name: 'conspiracy',
    aliases: ['teoria'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const subject = SUBJECTS[Math.floor(Math.random() * SUBJECTS.length)];
        const claim = CLAIMS[Math.floor(Math.random() * CLAIMS.length)];

        return reply(ctx, infoPanel('🛸 Teoría (100% inventada, solo por diversión)', `¿Y si ${subject} ${claim}? 👀`));
    },
};
