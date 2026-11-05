const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('firstmessage')
        .setDescription('Muestra un enlace al primer mensaje de este canal'),

    name: 'firstmessage',
    aliases: ['fm'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        try {
            const messages = await ctx.channel.messages.fetch({ after: '0', limit: 1 });
            const first = messages.first();

            if (!first) {
                return reply(ctx, { ...errorPanel('No encontrado', 'No pude encontrar el primer mensaje de este canal.'), ephemeral: true });
            }

            return reply(ctx, infoPanel('Primer mensaje del canal', `**Autor:** ${first.author.tag}\n**Fecha:** <t:${Math.floor(first.createdTimestamp / 1000)}:F>\n\n[Ir al mensaje](${first.url})`));
        } catch (err) {
            console.error('[firstmessage] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener el primer mensaje de este canal.'), ephemeral: true });
        }
    },
};
