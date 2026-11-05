const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, errorPanel, infoPanel } = require('../../lib/panel');
const { getGame, setGame, endGame } = require('../../lib/gameStore');

const WORDS = ['discord', 'javascript', 'programacion', 'servidor', 'teclado', 'internet', 'aventura', 'biblioteca', 'montana', 'oceano'];
const MAX_WRONG = 6;

function renderWord(word, guessed) {
    return [...word].map(ch => (guessed.includes(ch) ? ch : '_')).join(' ');
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hangman')
        .setDescription('Juega al ahorcado')
        .addSubcommand(s => s.setName('start').setDescription('Inicia un juego nuevo en este canal'))
        .addSubcommand(s => s.setName('guess').setDescription('Adivina una letra')
            .addStringOption(o => o.setName('letra').setDescription('Una sola letra').setRequired(true))),

    name: 'hangman',
    aliases: ['ahorcado'],
    category: 'diversión',
    cooldownMs: 1500,

    async execute(ctx, args = []) {
        const channelId = ctx.channel.id;
        let subcommand, letter;

        if (isSlash(ctx)) {
            subcommand = ctx.options.getSubcommand();
            letter = subcommand === 'guess' ? ctx.options.getString('letra')?.toLowerCase() : null;
        } else {
            subcommand = args[0]?.toLowerCase() === 'start' ? 'start' : 'guess';
            letter = subcommand === 'guess' ? args[0]?.toLowerCase() : null;
        }

        if (subcommand === 'start') {
            const word = WORDS[Math.floor(Math.random() * WORDS.length)];
            setGame(channelId, { type: 'hangman', word, guessed: [], wrong: 0 });
            return reply(ctx, infoPanel('🪢 Ahorcado', `Palabra: \`${renderWord(word, [])}\` (${word.length} letras)\nUsa \`/hangman guess <letra>\`.`));
        }

        const game = getGame(channelId);
        if (!game || game.type !== 'hangman') {
            return reply(ctx, { ...errorPanel('Sin juego activo', 'Inicia uno con `/hangman start`.'), ephemeral: true });
        }
        if (!letter || letter.length !== 1 || !/[a-zñ]/.test(letter)) {
            return reply(ctx, { ...errorPanel('Letra inválida', 'Especifica una sola letra.'), ephemeral: true });
        }
        if (game.guessed.includes(letter)) {
            return reply(ctx, { ...errorPanel('Ya la intentaste', 'Prueba con otra letra.'), ephemeral: true });
        }

        game.guessed.push(letter);
        if (!game.word.includes(letter)) game.wrong += 1;

        const display = renderWord(game.word, game.guessed);

        if (!display.includes('_')) {
            endGame(channelId);
            return reply(ctx, successPanel('¡Ganaste!', `La palabra era **${game.word}**.`));
        }
        if (game.wrong >= MAX_WRONG) {
            endGame(channelId);
            return reply(ctx, errorPanel('Perdiste', `La palabra era **${game.word}**.`));
        }

        return reply(ctx, infoPanel('🪢 Ahorcado', `Palabra: \`${display}\`\nErrores: ${game.wrong}/${MAX_WRONG}\nLetras usadas: ${game.guessed.join(', ') || 'ninguna'}`));
    },
};
