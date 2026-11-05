const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

// CoinGecko — API pública y gratuita, sin key para uso básico. https://www.coingecko.com/api
async function fetchPrice(coinId) {
    const res = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(coinId)}&vs_currencies=usd&include_24hr_change=true`);
    if (!res.ok) throw new Error(`coingecko ${res.status}`);
    return res.json();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('crypto')
        .setDescription('Consulta el precio de una criptomoneda en USD')
        .addStringOption(o => o.setName('moneda').setDescription('ID de CoinGecko, ej: bitcoin, ethereum, dogecoin').setRequired(true)),

    name: 'crypto',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const coinId = (isSlash(ctx) ? ctx.options.getString('moneda') : args[0])?.toLowerCase();
        if (!coinId) {
            return reply(ctx, { ...errorPanel('Falta la moneda', 'Especifica el ID de una criptomoneda, ej: `bitcoin`.'), ephemeral: true });
        }

        let data;
        try {
            data = await fetchPrice(coinId);
        } catch (err) {
            console.error('[crypto] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude consultar el precio en este momento.'), ephemeral: true });
        }

        const info = data[coinId];
        if (!info) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No encontré esa criptomoneda. Usa el ID de CoinGecko (ej: `bitcoin`, no `BTC`).'), ephemeral: true });
        }

        const change = info.usd_24h_change?.toFixed(2);
        const changeEmoji = change > 0 ? '📈' : '📉';

        return reply(ctx, infoPanel(`💰 ${coinId}`, `**Precio:** $${info.usd.toLocaleString('es-ES')}\n**Cambio 24h:** ${changeEmoji} ${change}%`));
    },
};
