const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

// exchangerate-api.com — endpoint abierto gratuito, sin key, actualizado diariamente.
async function fetchRate(from) {
    const res = await fetch(`https://open.er-api.com/v6/latest/${encodeURIComponent(from.toUpperCase())}`);
    if (!res.ok) throw new Error(`exchangerate ${res.status}`);
    return res.json();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('currencyconvert')
        .setDescription('Convierte una cantidad entre monedas')
        .addNumberOption(o => o.setName('cantidad').setDescription('Cantidad a convertir').setRequired(true))
        .addStringOption(o => o.setName('de').setDescription('Moneda origen (ej: USD)').setRequired(true))
        .addStringOption(o => o.setName('a').setDescription('Moneda destino (ej: EUR)').setRequired(true)),

    name: 'currencyconvert',
    aliases: ['convertirmoneda'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        let amount, from, to;
        if (isSlash(ctx)) {
            amount = ctx.options.getNumber('cantidad');
            from = ctx.options.getString('de');
            to = ctx.options.getString('a');
        } else {
            amount = parseFloat(args[0]);
            from = args[1];
            to = args[2];
        }

        if (!amount || !from || !to) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Uso: `/currencyconvert cantidad:<n> de:<USD> a:<EUR>`'), ephemeral: true });
        }

        let data;
        try {
            data = await fetchRate(from);
        } catch (err) {
            console.error('[currencyconvert] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener las tasas de cambio.'), ephemeral: true });
        }

        const rate = data.rates?.[to.toUpperCase()];
        if (!rate) {
            return reply(ctx, { ...errorPanel('Moneda no encontrada', 'Verifica los códigos de moneda (ej: USD, EUR, MXN).'), ephemeral: true });
        }

        const converted = amount * rate;
        return reply(ctx, infoPanel('💱 Conversión de moneda', `**${amount} ${from.toUpperCase()}** = **${converted.toFixed(2)} ${to.toUpperCase()}**`));
    },
};
