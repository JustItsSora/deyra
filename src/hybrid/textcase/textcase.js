const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('textcase')
        .setDescription('Cambia el formato de un texto (mayúsculas, minúsculas, título)')
        .addStringOption(o => o.setName('modo').setDescription('Formato deseado').setRequired(true)
            .addChoices({ name: 'MAYÚSCULAS', value: 'upper' }, { name: 'minúsculas', value: 'lower' }, { name: 'Título', value: 'title' }))
        .addStringOption(o => o.setName('texto').setDescription('Texto a convertir').setRequired(true)),

    name: 'textcase',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let mode, text;
        if (isSlash(ctx)) {
            mode = ctx.options.getString('modo');
            text = ctx.options.getString('texto');
        } else {
            mode = args[0]?.toLowerCase();
            text = args.slice(1).join(' ');
        }

        if (!['upper', 'lower', 'title'].includes(mode) || !text) {
            return reply(ctx, { ...errorPanel('Uso incorrecto', 'Uso: `/textcase modo:<upper|lower|title> texto:<texto>`'), ephemeral: true });
        }

        let result;
        if (mode === 'upper') result = text.toUpperCase();
        else if (mode === 'lower') result = text.toLowerCase();
        else result = text.replace(/\w\S*/g, w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase());

        return reply(ctx, infoPanel('Texto convertido', result));
    },
};
