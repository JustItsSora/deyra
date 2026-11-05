const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const crypto = require('crypto');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ratemyname')
        .setDescription('Califica un nombre del 1 al 100 (determinístico y divertido)')
        .addStringOption(o => o.setName('nombre').setDescription('El nombre a calificar').setRequired(true)),

    name: 'ratemyname',
    aliases: [],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args.join(' ');
        if (!name) {
            return reply(ctx, { ...errorPanel('Falta el nombre', 'Especifica un nombre a calificar.'), ephemeral: true });
        }

        const hash = crypto.createHash('md5').update(name.toLowerCase()).digest('hex');
        const score = parseInt(hash.slice(0, 4), 16) % 101;

        return reply(ctx, infoPanel('📛 Calificación de nombre', `El nombre **"${name}"** obtiene una calificación de **${score}/100**.`));
    },
};
