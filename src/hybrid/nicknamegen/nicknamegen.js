const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const ADJECTIVES = ['Veloz', 'Silencioso', 'Astuto', 'Feroz', 'Místico', 'Sombrío', 'Radiante', 'Salvaje'];
const NOUNS = ['Lobo', 'Fénix', 'Tigre', 'Dragón', 'Halcón', 'Sombra', 'Trueno', 'Estrella'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nicknamegen')
        .setDescription('Genera un apodo gamer/épico aleatorio'),

    name: 'nicknamegen',
    aliases: ['generarapodo'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
        const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
        const number = Math.floor(Math.random() * 999);

        return reply(ctx, infoPanel('🎮 Apodo generado', `**${adj}${noun}${number}**`));
    },
};
