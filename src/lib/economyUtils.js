// src/lib/economyUtils.js
const { Economy } = require('../data/models');

const CURRENCY_SYMBOL = '🪙';

/** Formatea un número grande con separadores de miles. */
function formatAmount(amount) {
    return `${CURRENCY_SYMBOL} ${Number(amount).toLocaleString('es-ES')}`;
}

/** Obtiene (o crea) el registro de economía de un usuario en un servidor. */
async function getBalance(guildId, userId) {
    const [record] = await Economy.findOrCreate({
        where: { guildId, userId },
        defaults: { guildId, userId },
    });
    return record;
}

/** Suma (o resta, si negativo) dinero a la billetera. Nunca deja el saldo negativo. */
async function addToWallet(guildId, userId, amount) {
    const record = await getBalance(guildId, userId);
    record.wallet = Math.max(0, Number(record.wallet) + amount);
    await record.save();
    return record;
}

/** Fórmula de XP necesaria para alcanzar `level`. Curva progresiva estándar. */
function xpForLevel(level) {
    return 5 * (level ** 2) + 50 * level + 100;
}

/** Dado un total de XP acumulado, calcula el nivel correspondiente. */
function levelFromXp(totalXp) {
    let level = 0;
    let remaining = totalXp;
    while (remaining >= xpForLevel(level)) {
        remaining -= xpForLevel(level);
        level++;
    }
    return level;
}

module.exports = { CURRENCY_SYMBOL, formatAmount, getBalance, addToWallet, xpForLevel, levelFromXp };
