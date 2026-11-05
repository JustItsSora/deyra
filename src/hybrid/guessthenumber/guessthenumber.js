const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel, infoPanel } = require('../../lib/panel');
const { getGame, setGame, endGame } = require('../../lib/gameStore');

const MAX_NUMBER = 100;
const MAX_ATTEMPTS = 7;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('guessthenumber')
        .setDescription(`Adivina el número entre 1 y ${MAX_NUMBER} en ${MAX_ATTEMPTS} intentos`)
        .addSubcommand(s => s.setName('start').setDescription('Inicia un juego nuevo en este canal'))
        .addSubcommand(s => s.setName('guess').setDescription('Intenta adivinar el número')
            .addIntegerOption(o => o.setName('numero').setDescription('Tu intento').setRequired(true))),

    name: 'guessthenumber',
    aliases: ['gtn'],
    category: 'diversión',
    cooldownMs: 1500,

    async execute(ctx, args = []) {
        const channelId = ctx.channel.id;
        let subcommand, guessValue;

        if (isSlash(ctx)) {
            subcommand = ctx.options.getSubcommand();
            guessValue = subcommand === 'guess' ? ctx.options.getInteger('numero') : null;
        } else {
            subcommand = args[0]?.toLowerCase() === 'start' ? 'start' : 'guess';
            guessValue = subcommand === 'guess' ? parseInt(args[0], 10) : null;
        }

        if (subcommand === 'start') {
            const target = Math.floor(Math.random() * MAX_NUMBER) + 1;
            setGame(channelId, { type: 'guessthenumber', target, attempts: 0, startedBy: getUserId(ctx) });
            return reply(ctx, infoPanel('🔢 Adivina el número', `Elegí un número entre 1 y ${MAX_NUMBER}. Tienes ${MAX_ATTEMPTS} intentos. Usa \`/guessthenumber guess <número>\`.`));
        }

        const game = getGame(channelId);
        if (!game || game.type !== 'guessthenumber') {
            return reply(ctx, { ...errorPanel('Sin juego activo', 'Inicia uno con `/guessthenumber start`.'), ephemeral: true });
        }
        if (!guessValue || Number.isNaN(guessValue)) {
            return reply(ctx, { ...errorPanel('Número inválido', 'Especifica un número válido.'), ephemeral: true });
        }

        game.attempts += 1;

        if (guessValue === game.target) {
            endGame(channelId);
            return reply(ctx, successPanel('¡Correcto!', `El número era **${game.target}**. Lo adivinaste en ${game.attempts} intento(s).`));
        }

        if (game.attempts >= MAX_ATTEMPTS) {
            endGame(channelId);
            return reply(ctx, errorPanel('Se acabaron los intentos', `El número era **${game.target}**. ¡Suerte la próxima!`));
        }

        const hint = guessValue < game.target ? 'más alto' : 'más bajo';
        return reply(ctx, infoPanel('Sigue intentando', `El número es **${hint}**. Intentos restantes: ${MAX_ATTEMPTS - game.attempts}.`));
    },
};
