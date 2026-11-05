const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const PREFIXES = ['Capitán', 'Doctor', 'La', 'El', 'Súper'];
const NAMES = ['Trueno', 'Fénix', 'Águila', 'Relámpago', 'Titán', 'Cometa', 'Guardián', 'Estelar'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('heroname')
        .setDescription('Genera tu nombre de superhéroe')
        .addUserOption(o => o.setName('usuario').setDescription('Para quién generar el nombre').setRequired(false)),

    name: 'heroname',
    aliases: ['nombreheroe'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const targetId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const prefix = PREFIXES[Math.floor(Math.random() * PREFIXES.length)];
        const name = NAMES[Math.floor(Math.random() * NAMES.length)];

        return reply(ctx, infoPanel('🦸‍♂️ Nombre de héroe', `<@${targetId}>, tu nombre de héroe es: **${prefix} ${name}**`));
    },
};
