const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channellist')
        .setDescription('Lista todos los canales de texto del servidor'),

    name: 'channellist',
    aliases: ['canales'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const channels = ctx.guild.channels.cache
            .filter(c => c.type === ChannelType.GuildText)
            .sort((a, b) => a.position - b.position);

        if (channels.size === 0) {
            return reply(ctx, infoPanel('Canales de texto', 'No hay canales de texto.'));
        }

        const lines = channels.map(c => `${c}`).slice(0, 40);
        return reply(ctx, infoPanel(`Canales de texto (${channels.size})`, undefined, { lines }));
    },
};
