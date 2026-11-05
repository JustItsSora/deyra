const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('roleinfo')
        .setDescription('Muestra información de un rol')
        .addRoleOption(o => o.setName('rol').setDescription('Rol a consultar').setRequired(true)),

    name: 'roleinfo',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

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

        const lines = [
            `**Nombre:** ${role}`,
            `**ID:** ${role.id}`,
            `**Color:** ${role.hexColor}`,
            `**Miembros:** ${role.members.size}`,
            `**Posición:** ${role.position}`,
            `**Mencionable:** ${role.mentionable ? 'Sí' : 'No'}`,
            `**Mostrado por separado:** ${role.hoist ? 'Sí' : 'No'}`,
            `**Creado:** <t:${Math.floor(role.createdTimestamp / 1000)}:F>`,
        ];

        return reply(ctx, infoPanel('Información del rol', undefined, { lines }));
    },
};
