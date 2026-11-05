// src/lib/giveawayUtils.js
function pickWinners(entrants, count) {
    if (!entrants || entrants.length === 0) return [];
    const pool = [...new Set(entrants)]; // sin duplicados
    const winners = [];
    const n = Math.min(count, pool.length);

    while (winners.length < n) {
        const idx = Math.floor(Math.random() * pool.length);
        const [picked] = pool.splice(idx, 1);
        winners.push(picked);
    }
    return winners;
}

module.exports = { pickWinners };
