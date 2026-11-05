const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojidecode')
        .setDescription('Muestra el código unicode de un emoji')
        .addStringOption(o => o.setName('emoji').setDescription('El emoji a decodificar').setRequired(true)),

    name: 'emojidecode',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const emoji = isSlash(ctx) ? ctx.options.getString('emoji') : args[0];
        if (!emoji) {
            return reply(ctx, { ...errorPanel('Falta el emoji', 'Especifica un emoji.'), ephemeral: true });
        }

        const codes = [...emoji].map(c => `U+${c.codePointAt(0).toString(16).toUpperCase()}`);
        return reply(ctx, infoPanel('Código unicode', codes.join(' ')));
    },
};
