const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('spoiler')
        .setDescription('Envía un texto oculto como spoiler')
        .addStringOption(o => o.setName('texto').setDescription('Texto a ocultar').setRequired(true)),

    name: 'spoiler',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a ocultar.'), ephemeral: true });
        }

        return reply(ctx, { content: `||${text}||` });
    },
};
