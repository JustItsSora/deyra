const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { HoneypotConfig } = require('../../../data/models');
const { invalidateCache } = require('../../../gateway/honeypot/honeypotEvents');

const LABELS = { timeout: 'Silenciar', kick: 'Expulsar', ban: 'Banear' };

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/honeypot action`.');

        const action = ctx.options.getString('accion');
        const timeoutMinutes = ctx.options.getInteger('timeout_minutos');

        const [config] = await HoneypotConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.action = action;
        if (timeoutMinutes !== null) {
            config.timeoutMinutes = Math.min(Math.max(timeoutMinutes, 1), 40320); // máx 28 días
        }
        await config.save();
        invalidateCache(ctx.guild.id);

        const detail = action === 'timeout' ? ` (${config.timeoutMinutes} minutos)` : '';
        return reply(ctx, successPanel('Acción actualizada', `Quien caiga en la trampa: **${LABELS[action]}**${detail}.`));
    },
};
