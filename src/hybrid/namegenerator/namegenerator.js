const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const PREFIXES = { fantasy: ['Thal', 'Kor', 'Zar', 'Vel', 'Mor', 'Syl'], scifi: ['Xen', 'Nyx', 'Vor', 'Quo', 'Zyl'], pirate: ['Barba', 'Garfio', 'Capitán', 'Ojo de'] };
const SUFFIXES = { fantasy: ['ion', 'andra', 'orin', 'ethil', 'vane'], scifi: ['-9', 'trix', 'on-7', 'ara'], pirate: ['Negro', 'Sangrienta', 'Tormenta', 'el Cruel'] };

module.exports = {
    data: new SlashCommandBuilder()
        .setName('namegenerator')
        .setDescription('Genera un nombre de fantasía, sci-fi o pirata')
        .addStringOption(o => o.setName('estilo').setDescription('Estilo del nombre').setRequired(true)
            .addChoices({ name: 'Fantasía', value: 'fantasy' }, { name: 'Ciencia ficción', value: 'scifi' }, { name: 'Pirata', value: 'pirate' })),

    name: 'namegenerator',
    aliases: ['generarnombre'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const style = isSlash(ctx) ? ctx.options.getString('estilo') : args[0]?.toLowerCase();
        if (!['fantasy', 'scifi', 'pirate'].includes(style)) {
            return reply(ctx, { ...errorPanel('Estilo inválido', 'Elige entre `fantasy`, `scifi` o `pirate`.'), ephemeral: true });
        }

        const prefix = PREFIXES[style][Math.floor(Math.random() * PREFIXES[style].length)];
        const suffix = SUFFIXES[style][Math.floor(Math.random() * SUFFIXES[style].length)];
        const name = style === 'pirate' ? `${prefix} ${suffix}` : `${prefix}${suffix}`;

        return reply(ctx, infoPanel('✨ Nombre generado', `**${name}**`));
    },
};
