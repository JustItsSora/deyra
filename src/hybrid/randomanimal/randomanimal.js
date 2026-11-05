const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const ANIMALS = ['Elefante', 'Jirafa', 'Pingüino', 'Delfín', 'Búho', 'Camaleón', 'Nutria', 'Lémur', 'Pangolín', 'Ornitorrinco', 'Capibara', 'Axolote'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomanimal')
        .setDescription('Muestra un animal aleatorio (nombre, no imagen)'),

    name: 'randomanimal',
    aliases: ['animalaleatorio'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        return reply(ctx, infoPanel('🐾 Animal aleatorio', `**${animal}**`));
    },
};
