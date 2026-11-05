const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, errorPanel, infoPanel } = require('../../lib/panel');
const { getGame, setGame, endGame } = require('../../lib/gameStore');

const WORDS = ['discord', 'servidor', 'programar', 'teclado', 'ventana', 'mensaje', 'usuario', 'internet', 'pantalla', 'archivo'];

function scrambleWord(word) {
    const letters = [...word];
    for (let i = letters.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [letters[i], letters[j]] = [letters[j], letters[i]];
    }
    const scrambled = letters.join('');
    return scrambled === word ? scrambleWord(word) : scrambled;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('scramble')
        .setDescription('Juego de desordenar palabras: adivina la palabra original')
        .addSubcommand(s => s.setName('start').setDescription('Inicia un juego nuevo en este canal'))
        .addSubcommand(s => s.setName('guess').setDescription('Intenta adivinar la palabra')
            .addStringOption(o => o.setName('palabra').setDescription('Tu intento').setRequired(true))),

    name: 'scramble',
    aliases: ['desordenar'],
    category: 'diversión',
    cooldownMs: 1500,

    async execute(ctx, args = []) {
        const channelId = ctx.channel.id;
        let subcommand, guess;

        if (isSlash(ctx)) {
            subcommand = ctx.options.getSubcommand();
            guess = subcommand === 'guess' ? ctx.options.getString('palabra')?.toLowerCase() : null;
        } else {
            subcommand = args[0]?.toLowerCase() === 'start' ? 'start' : 'guess';
            guess = subcommand === 'guess' ? args[0]?.toLowerCase() : null;
        }

        if (subcommand === 'start') {
            const word = WORDS[Math.floor(Math.random() * WORDS.length)];
            const scrambled = scrambleWord(word);
            setGame(channelId, { type: 'scramble', word });
            return reply(ctx, infoPanel('🔀 Desordenar palabras', `Palabra desordenada: **${scrambled.toUpperCase()}**\nUsa \`/scramble guess <palabra>\` para adivinar.`));
        }

        const game = getGame(channelId);
        if (!game || game.type !== 'scramble') {
            return reply(ctx, { ...errorPanel('Sin juego activo', 'Inicia uno con `/scramble start`.'), ephemeral: true });
        }

        if (guess === game.word) {
            endGame(channelId);
            return reply(ctx, successPanel('¡Correcto!', `La palabra era **${game.word}**.`));
        }
        return reply(ctx, { ...errorPanel('Incorrecto', 'Intenta de nuevo.'), ephemeral: true });
    },
};
