const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { buildPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('tictactoe')
        .setDescription('Reta a alguien a tres en raya')
        .addUserOption(o => o.setName('usuario').setDescription('Tu oponente').setRequired(true)),

    name: 'tictactoe',
    aliases: ['ttt'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const authorId = getUserId(ctx);
        const opponentId = isSlash(ctx) ? ctx.options.getUser('usuario')?.id : args[0]?.replace(/[<@!>]/g, '');

        if (!opponentId) {
            return reply(ctx, { ...errorPanel('Falta el oponente', 'Menciona a quién quieres retar.'), ephemeral: true });
        }
        if (opponentId === authorId) {
            return reply(ctx, { ...errorPanel('No puedes hacer eso', 'No puedes jugar contra ti mismo.'), ephemeral: true });
        }
        const opponent = await ctx.client.users.fetch(opponentId).catch(() => null);
        if (!opponent || opponent.bot) {
            return reply(ctx, { ...errorPanel('Oponente inválido', 'No puedes retar a un bot o a un usuario inexistente.'), ephemeral: true });
        }

        const board = Array(9).fill(null);
        const rows = buildBoardRows(board, authorId, opponentId, authorId);

        const panel = buildPanel({
            title: '⭕ Tres en raya',
            description: `<@${authorId}> (❌) vs <@${opponentId}> (⭕)\nTurno de: <@${authorId}>`,
            tone: 'primary',
            rows,
        });

        return reply(ctx, { components: [panel], flags: MessageFlags.IsComponentsV2 });
    },
};

// El estado del tablero viaja codificado en cada customId como una cadena de 9
// caracteres ('-' vacío, 'X', 'O'), para soportar múltiples partidas simultáneas
// en el mismo canal sin necesitar un store en memoria por canal.
function encodeBoard(board) {
    return board.map(c => (c === '❌' ? 'X' : c === '⭕' ? 'O' : '-')).join('');
}

function buildBoardRows(board, playerX, playerO, turn) {
    const rows = [];
    const encoded = encodeBoard(board);
    for (let r = 0; r < 3; r++) {
        const row = new ActionRowBuilder();
        for (let c = 0; c < 3; c++) {
            const idx = r * 3 + c;
            const cell = board[idx];
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`ttt_${idx}_${encoded}_${playerX}_${playerO}_${turn}`)
                    .setLabel(cell || '⠀')
                    .setStyle(cell === '❌' ? ButtonStyle.Danger : cell === '⭕' ? ButtonStyle.Primary : ButtonStyle.Secondary)
                    .setDisabled(!!cell),
            );
        }
        rows.push(row);
    }
    return rows;
}

module.exports.buildBoardRows = buildBoardRows;
module.exports.encodeBoard = encodeBoard;
