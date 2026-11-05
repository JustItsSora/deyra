const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const { Suggestion } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggestionlist')
        .setDescription('Lista las sugerencias pendientes del servidor'),

    name: 'suggestionlist',
    aliases: ['sugerenciaspendientes'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const pending = await Suggestion.findAll({ where: { guildId: ctx.guild.id, status: 'pending' }, limit: 15 });

        if (pending.length === 0) {
            return reply(ctx, infoPanel('Sugerencias pendientes', 'No hay sugerencias pendientes.'));
        }

        const lines = pending.map(s => `**${s.content.slice(0, 80)}** — 👍${s.upvotes} 👎${s.downvotes} — <@${s.authorId}>`);
        return reply(ctx, infoPanel(`💡 Sugerencias pendientes (${pending.length})`, undefined, { lines }));
    },
};
