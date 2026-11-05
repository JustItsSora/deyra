const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const WORKOUTS = ['20 min de cardio + 15 min de estiramiento', 'Rutina de piernas: sentadillas, zancadas, puente de glúteo', 'Yoga de 30 minutos para principiantes', 'Circuito de fuerza: flexiones, dominadas, plancha', 'Caminata rápida de 40 minutos', 'HIIT de 15 minutos'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('workoutidea')
        .setDescription('Sugiere una rutina de ejercicio aleatoria'),

    name: 'workoutidea',
    aliases: ['idearutina'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const workout = WORKOUTS[Math.floor(Math.random() * WORKOUTS.length)];
        return reply(ctx, infoPanel('💪 Idea de rutina', workout));
    },
};
