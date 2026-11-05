const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const COMMON_EMOJIS = {
    feliz: '😄', triste: '😢', enojado: '😠', amor: '❤️', risa: '😂', sorpresa: '😲',
    fuego: '🔥', estrella: '⭐', corazon: '❤️', sol: '☀️', luna: '🌙', lluvia: '🌧️',
    perro: '🐶', gato: '🐱', comida: '🍔', pizza: '🍕', cafe: '☕', musica: '🎵',
    fiesta: '🎉', dinero: '💰', tiempo: '⏰', idea: '💡', libro: '📖', juego: '🎮',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojisearch')
        .setDescription('Busca un emoji unicode relacionado con una palabra')
        .addStringOption(o => o.setName('palabra').setDescription('Palabra a buscar (en español)').setRequired(true)),

    name: 'emojisearch',
    aliases: ['buscaremoji'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const word = (isSlash(ctx) ? ctx.options.getString('palabra') : args[0])?.toLowerCase();
        if (!word) {
            return reply(ctx, { ...errorPanel('Falta la palabra', 'Especifica una palabra a buscar.'), ephemeral: true });
        }

        const emoji = COMMON_EMOJIS[word];
        if (!emoji) {
            return reply(ctx, infoPanel('Sin resultados', `No tengo un emoji asociado a "${word}". Prueba con: ${Object.keys(COMMON_EMOJIS).slice(0, 8).join(', ')}...`));
        }

        return reply(ctx, infoPanel('Emoji encontrado', `${emoji} — "${word}"`));
    },
};
