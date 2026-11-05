const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('acronym')
        .setDescription('Genera un acrónimo a partir de una frase (primeras letras de cada palabra)')
        .addStringOption(o => o.setName('frase').setDescription('Frase a convertir').setRequired(true)),

    name: 'acronym',
    aliases: ['acronimo'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('frase') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta la frase', 'Especifica una frase.'), ephemeral: true });
        }

        const acronym = text.trim().split(/\s+/).map(w => w[0]?.toUpperCase()).join('');
        return reply(ctx, infoPanel('Acrónimo generado', `**${acronym}**`));
    },
};
