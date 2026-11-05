const { SlashCommandBuilder, ChannelType } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channelcount')
        .setDescription('Muestra cuántos canales de cada tipo tiene el servidor'),

    name: 'channelcount',
    aliases: ['contarcanal'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const channels = ctx.guild.channels.cache;
        const text = channels.filter(c => c.type === ChannelType.GuildText).size;
        const voice = channels.filter(c => c.type === ChannelType.GuildVoice).size;
        const category = channels.filter(c => c.type === ChannelType.GuildCategory).size;
        const forum = channels.filter(c => c.type === ChannelType.GuildForum).size;

        return reply(ctx, infoPanel('Conteo de canales', undefined, {
            lines: [
                `**Total:** ${channels.size}`,
                `**Texto:** ${text}`,
                `**Voz:** ${voice}`,
                `**Categorías:** ${category}`,
                `**Foros:** ${forum}`,
            ],
        }));
    },
};
