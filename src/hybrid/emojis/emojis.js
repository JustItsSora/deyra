const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojis')
        .setDescription('Lista los emojis personalizados del servidor'),

    name: 'emojis',
    aliases: ['emotes'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const emojis = ctx.guild.emojis.cache;
        if (emojis.size === 0) {
            return reply(ctx, infoPanel('Emojis del servidor', 'Este servidor no tiene emojis personalizados.'));
        }

        const display = emojis.map(e => e.toString()).slice(0, 100).join(' ');
        return reply(ctx, infoPanel(`Emojis del servidor (${emojis.size})`, display));
    },
};
