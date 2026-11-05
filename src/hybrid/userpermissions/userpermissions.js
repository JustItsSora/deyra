const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userpermissions')
        .setDescription('Muestra TODOS los permisos de un usuario a nivel de servidor')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    name: 'userpermissions',
    aliases: ['permisosusuario'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const userId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const member = await ctx.guild.members.fetch(userId).catch(() => null);

        if (!member) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario.'), ephemeral: true });
        }

        const allPerms = Object.keys(PermissionsBitField.Flags);
        const granted = allPerms.filter(p => member.permissions.has(p));

        if (granted.length === 0) {
            return reply(ctx, infoPanel(`Permisos de ${member.user.username}`, 'No tiene permisos especiales a nivel de servidor.'));
        }

        return reply(ctx, infoPanel(`Permisos de ${member.user.username} (${granted.length})`, granted.join(', ')));
    },
};
