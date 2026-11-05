const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const SUITS = [{ name: 'Corazones', emoji: '♥️' }, { name: 'Diamantes', emoji: '♦️' }, { name: 'Tréboles', emoji: '♣️' }, { name: 'Picas', emoji: '♠️' }];
const RANKS = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('cardpull')
        .setDescription('Extrae una carta aleatoria de una baraja de 52'),

    name: 'cardpull',
    aliases: ['carta'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const suit = SUITS[Math.floor(Math.random() * SUITS.length)];
        const rank = RANKS[Math.floor(Math.random() * RANKS.length)];

        return reply(ctx, infoPanel('🃏 Carta extraída', `**${rank} de ${suit.name}** ${suit.emoji}`));
    },
};
