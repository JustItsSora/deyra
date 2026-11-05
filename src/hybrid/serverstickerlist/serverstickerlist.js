const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverstickerlist')
        .setDescription('Lista los stickers del servidor'),

    name: 'serverstickerlist',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const stickers = ctx.guild.stickers.cache;
        if (stickers.size === 0) {
            return reply(ctx, infoPanel('Stickers del servidor', 'Este servidor no tiene stickers personalizados.'));
        }

        const lines = [...stickers.values()].map(s => `**${s.name}** — ${s.description || 'Sin descripción'}`);
        return reply(ctx, infoPanel(`Stickers del servidor (${stickers.size})`, undefined, { lines }));
    },
};
