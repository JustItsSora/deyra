const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('permissions')
        .setDescription('Muestra los permisos de un usuario en este canal')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    name: 'permissions',
    aliases: ['perms'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const userId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const member = await ctx.guild.members.fetch(userId).catch(() => null);

        if (!member) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario.'), ephemeral: true });
        }

        const perms = ctx.channel.permissionsFor(member);
        if (!perms) {
            return reply(ctx, { ...errorPanel('Error', 'No pude calcular los permisos.'), ephemeral: true });
        }

        const relevantPerms = [
            'Administrator', 'ManageGuild', 'ManageChannels', 'ManageRoles', 'ManageMessages',
            'KickMembers', 'BanMembers', 'ModerateMembers', 'MentionEveryone', 'ManageWebhooks',
            'ManageNicknames', 'ManageEmojisAndStickers', 'ViewAuditLog',
        ];

        const granted = relevantPerms.filter(p => perms.has(p));
        const lines = granted.length > 0 ? granted.map(p => `✅ ${p}`) : ['Sin permisos administrativos destacados.'];

        return reply(ctx, infoPanel(`Permisos de ${member.user.username} en #${ctx.channel.name}`, undefined, { lines }));
    },
};
