// src/gateway/interactions/tttHandler.js
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { buildPanel } = require('../../lib/panel');

const WIN_LINES = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
];

function decodeBoard(str) {
    return [...str].map(c => (c === 'X' ? '❌' : c === 'O' ? '⭕' : null));
}
function encodeBoard(board) {
    return board.map(c => (c === '❌' ? 'X' : c === '⭕' ? 'O' : '-')).join('');
}

function checkWinner(board) {
    for (const [a, b, c] of WIN_LINES) {
        if (board[a] && board[a] === board[b] && board[b] === board[c]) return board[a];
    }
    if (board.every(c => c)) return 'draw';
    return null;
}

function buildBoardRows(board, playerX, playerO, turn, disabled = false) {
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
                    .setDisabled(disabled || !!cell),
            );
        }
        rows.push(row);
    }
    return rows;
}

module.exports = {
    async handle(interaction) {
        const [, idxStr, encoded, playerX, playerO, turn] = interaction.customId.split('_');
        const idx = parseInt(idxStr, 10);

        if (interaction.user.id !== turn) {
            return interaction.reply({ content: 'No es tu turno.', flags: MessageFlags.Ephemeral}).catch(() => {});
        }

        const board = decodeBoard(encoded);
        if (board[idx]) {
            return interaction.reply({ content: 'Esa casilla ya está ocupada.', flags: MessageFlags.Ephemeral}).catch(() => {});
        }

        const symbol = turn === playerX ? '❌' : '⭕';
        board[idx] = symbol;

        const winner = checkWinner(board);
        const nextTurn = turn === playerX ? playerO : playerX;

        if (winner) {
            const rows = buildBoardRows(board, playerX, playerO, nextTurn, true);
            const desc = winner === 'draw'
                ? '¡Empate!'
                : `¡<@${winner === '❌' ? playerX : playerO}> gana!`;
            const panel = buildPanel({ title: '⭕ Tres en raya — Finalizado', description: desc, tone: winner === 'draw' ? 'neutral' : 'success', rows });
            return interaction.update({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        }

        const rows = buildBoardRows(board, playerX, playerO, nextTurn);
        const panel = buildPanel({
            title: '⭕ Tres en raya',
            description: `<@${playerX}> (❌) vs <@${playerO}> (⭕)\nTurno de: <@${nextTurn}>`,
            tone: 'primary',
            rows,
        });
        return interaction.update({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
    },
};
