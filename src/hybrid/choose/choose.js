const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('choose')
        .setDescription('Elige una opción al azar de una lista')
        .addStringOption(o => o.setName('opciones').setDescription('Opciones separadas por comas').setRequired(true)),

    name: 'choose',
    aliases: ['elegir'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('opciones') : args.join(' ');
        if (!raw) {
            return reply(ctx, { ...errorPanel('Faltan opciones', 'Especifica al menos dos opciones separadas por comas.'), ephemeral: true });
        }

        const options = raw.split(',').map(o => o.trim()).filter(Boolean);
        if (options.length < 2) {
            return reply(ctx, { ...errorPanel('Muy pocas opciones', 'Especifica al menos dos opciones separadas por comas.'), ephemeral: true });
        }

        const pick = options[Math.floor(Math.random() * options.length)];
        return reply(ctx, infoPanel('🎯 Elegí...', `**${pick}**`));
    },
};
