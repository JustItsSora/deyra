const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const PET_NAMES = ['Luna', 'Max', 'Rocky', 'Bella', 'Milo', 'Coco', 'Toby', 'Nala', 'Simba', 'Kira', 'Zeus', 'Maya'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('petname')
        .setDescription('Genera un nombre aleatorio para una mascota'),

    name: 'petname',
    aliases: ['nombremascota'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const name = PET_NAMES[Math.floor(Math.random() * PET_NAMES.length)];
        return reply(ctx, infoPanel('🐾 Nombre de mascota', `**${name}**`));
    },
};
