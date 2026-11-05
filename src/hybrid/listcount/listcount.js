const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('listcount')
        .setDescription('Cuenta cuántos elementos tiene una lista')
        .addStringOption(o => o.setName('elementos').setDescription('Elementos separados por comas').setRequired(true)),

    name: 'listcount',
    aliases: ['contarlista'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('elementos') : args.join(' ');
        if (!raw) {
            return reply(ctx, { ...errorPanel('Faltan elementos', 'Especifica elementos separados por comas.'), ephemeral: true });
        }

        const items = raw.split(',').map(i => i.trim()).filter(Boolean);
        return reply(ctx, infoPanel('Conteo de lista', `La lista tiene **${items.length}** elemento(s).`));
    },
};
