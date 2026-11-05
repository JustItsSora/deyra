const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('membercount')
        .setDescription('Muestra el número de miembros del servidor'),

    name: 'membercount',
    aliases: ['mc', 'miembros'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const guild = ctx.guild;
        await guild.members.fetch();

        const total = guild.memberCount;
        const bots = guild.members.cache.filter(m => m.user.bot).size;
        const humans = total - bots;

        return reply(ctx, infoPanel(`Miembros de ${guild.name}`, undefined, {
            lines: [`**Total:** ${total}`, `**Humanos:** ${humans}`, `**Bots:** ${bots}`],
        }));
    },
};
