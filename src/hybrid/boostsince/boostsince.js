const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('boostsince')
        .setDescription('Muestra desde cuándo un usuario está boosteando el servidor')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    name: 'boostsince',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const userId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const member = await ctx.guild.members.fetch(userId).catch(() => null);

        if (!member) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario en este servidor.'), ephemeral: true });
        }
        if (!member.premiumSince) {
            return reply(ctx, infoPanel('Estado de boost', `${member.user.username} no está boosteando este servidor.`));
        }

        return reply(ctx, infoPanel(`Boost de ${member.user.username}`, `Boosteando desde <t:${Math.floor(member.premiumSince.getTime() / 1000)}:D>.`));
    },
};
