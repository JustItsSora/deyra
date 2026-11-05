const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('categorylist')
        .setDescription('Lista todas las categorías del servidor'),

    name: 'categorylist',
    aliases: ['categorias'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const categories = ctx.guild.channels.cache
            .filter(c => c.type === ChannelType.GuildCategory)
            .sort((a, b) => a.position - b.position);

        if (categories.size === 0) {
            return reply(ctx, infoPanel('Categorías', 'No hay categorías en este servidor.'));
        }

        const lines = categories.map(c => {
            const childCount = ctx.guild.channels.cache.filter(ch => ch.parentId === c.id).size;
            return `**${c.name}** — ${childCount} canal(es)`;
        });

        return reply(ctx, infoPanel(`Categorías (${categories.size})`, undefined, { lines }));
    },
};
