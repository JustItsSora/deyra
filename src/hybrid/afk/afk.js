const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel } = require('../../lib/panel');
const { Afk } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('afk')
        .setDescription('Marca tu estado como AFK')
        .addStringOption(o => o.setName('razon').setDescription('Razón de tu ausencia').setRequired(false)),

    name: 'afk',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const reason = isSlash(ctx) ? (ctx.options.getString('razon') || 'AFK') : (args.join(' ') || 'AFK');
        const userId = getUserId(ctx);

        await Afk.upsert({ guildId: ctx.guild.id, userId, reason, mentionCount: 0 });

        return reply(ctx, successPanel('Estado AFK activado', `Te marqué como AFK: **${reason}**`));
    },
};
