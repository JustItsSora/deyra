const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const NAMES = {
    niño: ['Mateo', 'Santiago', 'Leo', 'Emiliano', 'Diego', 'Lucas', 'Daniel', 'Sebastián'],
    niña: ['Sofía', 'Valentina', 'Isabella', 'Camila', 'Mariana', 'Regina', 'Ximena', 'Renata'],
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('babyname')
        .setDescription('Genera un nombre de bebé aleatorio')
        .addStringOption(o => o.setName('genero').setDescription('niño o niña').setRequired(true).addChoices({ name: 'Niño', value: 'niño' }, { name: 'Niña', value: 'niña' })),

    name: 'babyname',
    aliases: ['nombrebebe'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const gender = isSlash(ctx) ? ctx.options.getString('genero') : args[0]?.toLowerCase();
        const pool = NAMES[gender];

        if (!pool) {
            return reply(ctx, { ...errorPanel('Opción inválida', 'Elige `niño` o `niña`.'), ephemeral: true });
        }

        const name = pool[Math.floor(Math.random() * pool.length)];
        return reply(ctx, infoPanel('👶 Nombre de bebé', `**${name}**`));
    },
};
