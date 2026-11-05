const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, errorPanel, infoPanel } = require('../../lib/panel');
const { getGame, setGame, endGame } = require('../../lib/gameStore');

const WORDS = ['PIANO', 'CAMPO', 'LUCES', 'PLAYA', 'RATON', 'NIEVE', 'FLORA', 'TREN', 'LOBO', 'MESA'].filter(w => w.length === 5);
const MAX_ATTEMPTS = 6;

function evaluateGuess(guess, target) {
    const result = [];
    const targetChars = [...target];
    const guessChars = [...guess];
    const used = Array(5).fill(false);

    // primera pasada: verdes
    for (let i = 0; i < 5; i++) {
        if (guessChars[i] === targetChars[i]) {
            result[i] = '🟩';
            used[i] = true;
        }
    }
    // segunda pasada: amarillos/grises
    for (let i = 0; i < 5; i++) {
        if (result[i]) continue;
        const idx = targetChars.findIndex((c, j) => c === guessChars[i] && !used[j]);
        if (idx !== -1) {
            result[i] = '🟨';
            used[idx] = true;
        } else {
            result[i] = '⬛';
        }
    }
    return result.join('');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('wordle')
        .setDescription('Juega Wordle (palabras de 5 letras) en este canal')
        .addSubcommand(s => s.setName('start').setDescription('Inicia un juego nuevo'))
        .addSubcommand(s => s.setName('guess').setDescription('Intenta una palabra de 5 letras')
            .addStringOption(o => o.setName('palabra').setDescription('Tu intento (5 letras)').setRequired(true))),

    name: 'wordle',
    aliases: [],
    category: 'diversión',
    cooldownMs: 1500,

    async execute(ctx, args = []) {
        const channelId = ctx.channel.id;
        let subcommand, guess;

        if (isSlash(ctx)) {
            subcommand = ctx.options.getSubcommand();
            guess = subcommand === 'guess' ? ctx.options.getString('palabra')?.toUpperCase() : null;
        } else {
            subcommand = args[0]?.toLowerCase() === 'start' ? 'start' : 'guess';
            guess = subcommand === 'guess' ? args[0]?.toUpperCase() : null;
        }

        if (subcommand === 'start') {
            const target = WORDS[Math.floor(Math.random() * WORDS.length)];
            setGame(channelId, { type: 'wordle', target, history: [] });
            return reply(ctx, infoPanel('🟩 Wordle', `Adivina la palabra de 5 letras. Tienes ${MAX_ATTEMPTS} intentos. Usa \`/wordle guess <palabra>\`.`));
        }

        const game = getGame(channelId);
        if (!game || game.type !== 'wordle') {
            return reply(ctx, { ...errorPanel('Sin juego activo', 'Inicia uno con `/wordle start`.'), ephemeral: true });
        }
        if (!guess || guess.length !== 5) {
            return reply(ctx, { ...errorPanel('Palabra inválida', 'Debe tener exactamente 5 letras.'), ephemeral: true });
        }

        const evaluation = evaluateGuess(guess, game.target);
        game.history.push(`${evaluation} \`${guess}\``);

        if (guess === game.target) {
            endGame(channelId);
            return reply(ctx, successPanel('¡Ganaste!', `${game.history.join('\n')}\n\nLa palabra era **${game.target}**.`));
        }

        if (game.history.length >= MAX_ATTEMPTS) {
            endGame(channelId);
            return reply(ctx, errorPanel('Se acabaron los intentos', `${game.history.join('\n')}\n\nLa palabra era **${game.target}**.`));
        }

        return reply(ctx, infoPanel('🟩 Wordle', `${game.history.join('\n')}\n\nIntentos restantes: ${MAX_ATTEMPTS - game.history.length}`));
    },
};
