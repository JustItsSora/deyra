const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('inrole')
        .setDescription('Lista los miembros que tienen un rol específico')
        .addRoleOption(o => o.setName('rol').setDescription('Rol a consultar').setRequired(true)),

    name: 'inrole',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        let role;
        if (isSlash(ctx)) {
            role = ctx.options.getRole('rol');
        } else {
            const id = args[0]?.replace(/[<@&>]/g, '');
            role = id ? ctx.guild.roles.cache.get(id) : null;
        }

        if (!role) {
            return reply(ctx, { ...errorPanel('Rol inválido', 'Especifica un rol válido.'), ephemeral: true });
        }

        await ctx.guild.members.fetch();
        const members = role.members;

        if (members.size === 0) {
            return reply(ctx, infoPanel(`Miembros con ${role.name}`, 'Nadie tiene este rol.'));
        }

        const lines = [...members.values()].slice(0, 40).map(m => `${m}`);
        return reply(ctx, infoPanel(`Miembros con ${role.name} (${members.size})`, undefined, { lines }));
    },
};
