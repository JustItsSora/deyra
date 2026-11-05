const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const CURSES = [
    'que se te acabe la batería cuando más lo necesites',
    'que siempre te toque el asiento del medio',
    'que se te caiga el helado antes de probarlo',
    'que tu WiFi se desconecte en el peor momento',
    'que pises un charco con calcetines puestos',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('curse')
        .setDescription('Lanza una maldición (de broma) a alguien')
        .addUserOption(o => o.setName('usuario').setDescription('A quién maldecir').setRequired(true)),

    name: 'curse',
    aliases: ['maldicion'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const authorId = getUserId(ctx);
        const targetId = isSlash(ctx) ? ctx.options.getUser('usuario')?.id : args[0]?.replace(/[<@!>]/g, '');

        if (!targetId) {
            return reply(ctx, { ...errorPanel('Falta el usuario', 'Menciona a quién quieres maldecir.'), ephemeral: true });
        }

        const curse = CURSES[Math.floor(Math.random() * CURSES.length)];
        return reply(ctx, infoPanel('😈 Maldición', `<@${authorId}> maldice a <@${targetId}>: ${curse}.`));
    },
};
