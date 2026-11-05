const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nameinitials')
        .setDescription('Extrae las iniciales de un nombre completo')
        .addStringOption(o => o.setName('nombre').setDescription('Nombre completo').setRequired(true)),

    name: 'nameinitials',
    aliases: ['iniciales'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args.join(' ');
        if (!name) {
            return reply(ctx, { ...errorPanel('Falta el nombre', 'Especifica un nombre completo.'), ephemeral: true });
        }

        const initials = name.trim().split(/\s+/).map(w => w[0]?.toUpperCase()).join('.');
        return reply(ctx, infoPanel('Iniciales', `**${initials}.**`));
    },
};
