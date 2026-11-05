const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const { Afk } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afkstatus')
        .setDescription('Consulta si un usuario está AFK')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    name: 'afkstatus',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const userId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));

        const entry = await Afk.findOne({ where: { guildId: ctx.guild.id, userId } });
        if (!entry) {
            return reply(ctx, infoPanel('Estado AFK', `<@${userId}> no está AFK.`));
        }

        return reply(ctx, infoPanel('Estado AFK', `<@${userId}> está AFK: **${entry.reason}**\nMenciones recibidas: ${entry.mentionCount}`));
    },
};
