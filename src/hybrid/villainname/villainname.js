const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const TITLES = ['Doctor', 'Lord', 'La', 'El', 'Maestro'];
const NAMES = ['Caos', 'Sombra', 'Veneno', 'Destrucción', 'Tinieblas', 'Furia', 'Pesadilla', 'Vacío'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('villainname')
        .setDescription('Genera tu nombre de villano')
        .addUserOption(o => o.setName('usuario').setDescription('Para quién generar el nombre').setRequired(false)),

    name: 'villainname',
    aliases: ['nombrevillano'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const targetId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const title = TITLES[Math.floor(Math.random() * TITLES.length)];
        const name = NAMES[Math.floor(Math.random() * NAMES.length)];

        return reply(ctx, infoPanel('🦹 Nombre de villano', `<@${targetId}>, tu nombre de villano es: **${title} ${name}**`));
    },
};
