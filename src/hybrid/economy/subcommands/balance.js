// /economy balance — saldo del usuario.
//
// La barra de "capacity" del banco es la novelty: muestra cuán llena está la
// billetera vs el banco, que es la decisión real que la gente tiene que tomar
// (depositar es gratis, pero el banco tiene tope).

const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');
const ui = require('../../../lib/ui');

module.exports = {
    async execute(ctx, args) {
        const userId = isSlash(ctx)
            ? (ctx.options.getUser('usuario')?.id || getUserId(ctx))
            : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));

        const user = await ctx.client.users.fetch(userId).catch(() => null);
        if (!user) {
            return reply(ctx, ui.error('Usuario no encontrado', 'No pude encontrar a ese usuario.', { ephemeral: true }));
        }

        const record = await getBalance(ctx.guild.id, userId);
        const wallet = Number(record.wallet);
        const bank = Number(record.bank);
        const capacity = Math.max(1, Number(record.bankCapacity));
        const total = wallet + bank;

        return reply(ctx, ui.payload({
            category: 'economía',
            kicker: 'Tu saldo',
            title: `${user.username}`,
            icon: '💰',
            sections: [{
                text: [
                    `**${formatAmount(total)}** en total`,
                    `-# ${user.bot ? '🤖 Cuenta de bot' : 'Cuenta del servidor'}`,
                ],
                accessory: {
                    url: user.displayAvatarURL({ size: 128, extension: 'png' }),
                    description: user.username,
                },
            }],
            stats: [
                { label: 'Billetera', value: formatAmount(wallet), icon: '👛' },
                { label: 'Banco', value: formatAmount(bank), icon: '🏦' },
            ],
            meters: [
                { label: 'Billetera', value: wallet, max: Math.max(wallet, capacity), style: 'line' },
                { label: 'Banco', value: bank, max: capacity, style: 'rounded' },
            ],
            grid: [
                ['Total', formatAmount(total)],
                ['Tope del banco', formatAmount(capacity)],
                ['Espacio libre', formatAmount(Math.max(0, capacity - bank))],
            ],
            callouts: bank < capacity ? [{
                tone: 'info',
                text: `Podés depositar **${formatAmount(Math.max(0, capacity - bank))}** más sin pagar comisión.`,
            }] : [{ tone: 'success', text: 'Tu banco está al máximo. Subir el tope cuesta monedas con `/economy bankupgrade`.' }],
        }));
    },
};
