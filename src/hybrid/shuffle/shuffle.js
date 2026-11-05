const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shuffle')
        .setDescription('Mezcla una lista de elementos al azar')
        .addStringOption(o => o.setName('elementos').setDescription('Elementos separados por comas').setRequired(true)),

    name: 'shuffle',
    aliases: ['mezclar'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('elementos') : args.join(' ');
        if (!raw) {
            return reply(ctx, { ...errorPanel('Faltan elementos', 'Especifica una lista de elementos separados por comas.'), ephemeral: true });
        }

        const items = raw.split(',').map(i => i.trim()).filter(Boolean);
        for (let i = items.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [items[i], items[j]] = [items[j], items[i]];
        }

        return reply(ctx, infoPanel('🔀 Lista mezclada', items.join(', ')));
    },
};
