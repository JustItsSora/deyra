const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, errorPanel, infoPanel } = require('../../lib/panel');
const { getGame, setGame, endGame } = require('../../lib/gameStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mathquiz')
        .setDescription('Resuelve una operación matemática aleatoria')
        .addSubcommand(s => s.setName('start').setDescription('Genera una nueva operación'))
        .addSubcommand(s => s.setName('answer').setDescription('Responde la operación actual')
            .addIntegerOption(o => o.setName('resultado').setDescription('Tu respuesta').setRequired(true))),

    name: 'mathquiz',
    aliases: [],
    category: 'diversión',
    cooldownMs: 1500,

    async execute(ctx, args = []) {
        const channelId = ctx.channel.id;
        let subcommand, answer;

        if (isSlash(ctx)) {
            subcommand = ctx.options.getSubcommand();
            answer = subcommand === 'answer' ? ctx.options.getInteger('resultado') : null;
        } else {
            subcommand = args[0]?.toLowerCase() === 'start' ? 'start' : 'answer';
            answer = subcommand === 'answer' ? parseInt(args[0], 10) : null;
        }

        if (subcommand === 'start') {
            const a = Math.floor(Math.random() * 50) + 1;
            const b = Math.floor(Math.random() * 50) + 1;
            const ops = ['+', '-', '*'];
            const op = ops[Math.floor(Math.random() * ops.length)];
            const result = op === '+' ? a + b : op === '-' ? a - b : a * b;

            setGame(channelId, { type: 'mathquiz', result });
            return reply(ctx, infoPanel('🧮 Operación matemática', `**${a} ${op} ${b} = ?**\nUsa \`/mathquiz answer <número>\` para responder.`));
        }

        const game = getGame(channelId);
        if (!game || game.type !== 'mathquiz') {
            return reply(ctx, { ...errorPanel('Sin operación activa', 'Inicia una con `/mathquiz start`.'), ephemeral: true });
        }

        if (answer === game.result) {
            endGame(channelId);
            return reply(ctx, successPanel('¡Correcto!', `La respuesta era **${game.result}**.`));
        }
        return reply(ctx, { ...errorPanel('Incorrecto', 'Intenta de nuevo.'), ephemeral: true });
    },
};
