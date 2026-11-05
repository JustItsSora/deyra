const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stickercount')
        .setDescription('Muestra cuántos stickers tiene el servidor'),

    name: 'stickercount',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const stickers = ctx.guild.stickers.cache;
        return reply(ctx, infoPanel('Conteo de stickers', `Este servidor tiene **${stickers.size}** sticker(s).`));
    },
};
