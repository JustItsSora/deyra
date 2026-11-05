const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const TYPE_NAMES = {
    [ChannelType.GuildText]: 'Texto',
    [ChannelType.GuildVoice]: 'Voz',
    [ChannelType.GuildCategory]: 'Categoría',
    [ChannelType.GuildAnnouncement]: 'Anuncios',
    [ChannelType.GuildForum]: 'Foro',
    [ChannelType.GuildStageVoice]: 'Escenario',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelinfo')
        .setDescription('Muestra información del canal actual')
        .addChannelOption(o => o.setName('canal').setDescription('Canal a consultar (default: actual)').setRequired(false)),

    name: 'channelinfo',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const channel = (ctx.options?.getChannel('canal')) || ctx.channel;

        const lines = [
            `**Nombre:** ${channel.name}`,
            `**ID:** ${channel.id}`,
            `**Tipo:** ${TYPE_NAMES[channel.type] || 'Desconocido'}`,
            `**Categoría:** ${channel.parent?.name || 'Ninguna'}`,
            `**Creado:** <t:${Math.floor(channel.createdTimestamp / 1000)}:F>`,
        ];

        if (channel.topic) lines.push(`**Tema:** ${channel.topic}`);
        if (typeof channel.rateLimitPerUser === 'number' && channel.rateLimitPerUser > 0) {
            lines.push(`**Slowmode:** ${channel.rateLimitPerUser}s`);
        }

        return reply(ctx, infoPanel('Información del canal', undefined, { lines }));
    },
};
