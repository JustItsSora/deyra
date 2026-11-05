const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { getBalance, formatAmount } = require('../../../lib/economyUtils');

module.exports = {
    async execute(ctx, args) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Servidor**.'), ephemeral: true });
        }

        let targetId, amount;
        if (isSlash(ctx)) {
            targetId = ctx.options.getUser('usuario')?.id;
            amount = ctx.options.getInteger('cantidad');
        } else {
            targetId = args[0]?.replace(/[<@!>]/g, '');
            amount = parseInt(args[1], 10);
        }

        if (!targetId || !amount || amount <= 0) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica un usuario y una cantidad positiva.'), ephemeral: true });
        }

        const record = await getBalance(ctx.guild.id, targetId);
        record.wallet = Math.max(0, Number(record.wallet) - amount);
        await record.save();

        return reply(ctx, successPanel('Dinero removido', `Se le quitaron ${formatAmount(amount)} a <@${targetId}>.`));
    },
};
