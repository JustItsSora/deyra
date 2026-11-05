const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const POWERS = [
    'teletransportación', 'lectura de mentes', 'control del tiempo', 'invisibilidad',
    'super fuerza', 'vuelo', 'curación instantánea', 'control de elementos',
    'viaje en el tiempo', 'super velocidad', 'transformación', 'telequinesis',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('superpower')
        .setDescription('Te asigna un superpoder aleatorio')
        .addUserOption(o => o.setName('usuario').setDescription('A quién asignarle el poder').setRequired(false)),

    name: 'superpower',
    aliases: ['superpoder'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const targetId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const power = POWERS[Math.floor(Math.random() * POWERS.length)];

        return reply(ctx, infoPanel('🦸 Superpoder asignado', `<@${targetId}> tiene el poder de: **${power}**`));
    },
};
