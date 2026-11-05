const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('joindate')
        .setDescription('Muestra cuándo se unió un usuario a este servidor')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    name: 'joindate',
    aliases: ['fechaunion'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const userId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const member = await ctx.guild.members.fetch(userId).catch(() => null);

        if (!member) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario en este servidor.'), ephemeral: true });
        }

        const days = Math.floor((Date.now() - member.joinedTimestamp) / 86400000);
        return reply(ctx, infoPanel(`Fecha de ingreso de ${member.user.username}`, `Se unió <t:${Math.floor(member.joinedTimestamp / 1000)}:D> (hace ${days.toLocaleString('es-ES')} días).`));
    },
};
