const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { reply } = require('../../lib/reply');
const { buildPanel } = require('../../lib/panel');
const { MessageFlags } = require('discord.js');

const QUESTIONS = [
    ['tener la capacidad de volar', 'tener la capacidad de ser invisible'],
    ['no volver a comer pizza', 'no volver a comer hamburguesas'],
    ['vivir sin música', 'vivir sin películas'],
    ['saber cuándo vas a morir', 'saber cómo vas a morir'],
    ['ser el más inteligente del grupo', 'ser el más divertido del grupo'],
    ['viajar al pasado', 'viajar al futuro'],
    ['tener dinero ilimitado', 'tener tiempo ilimitado'],
    ['perder todos tus recuerdos', 'nunca poder crear recuerdos nuevos'],
    ['vivir sin internet', 'vivir sin aire acondicionado/calefacción'],
    ['ser famoso pero pobre', 'ser rico pero desconocido'],
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wouldyourather')
        .setDescription('¿Qué prefieres? Genera una pregunta aleatoria'),

    name: 'wouldyourather',
    aliases: ['wyr', 'quepreferirias'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        const [a, b] = QUESTIONS[Math.floor(Math.random() * QUESTIONS.length)];

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('wyr_a').setLabel(`A: ${a}`.slice(0, 80)).setStyle(ButtonStyle.Primary),
            new ButtonBuilder().setCustomId('wyr_b').setLabel(`B: ${b}`.slice(0, 80)).setStyle(ButtonStyle.Secondary),
        );

        const panel = buildPanel({
            title: '🤔 ¿Qué prefieres?',
            description: `**A)** ${a}\n**B)** ${b}`,
            tone: 'primary',
            rows: [row],
        });

        return reply(ctx, { components: [panel], flags: MessageFlags.IsComponentsV2 });
    },
};
