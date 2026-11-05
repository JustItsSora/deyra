const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { HoneypotConfig } = require('../../../data/models');
const { invalidateCache } = require('../../../gateway/honeypot/honeypotEvents');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/honeypot toggle`.');

        const active = ctx.options.getBoolean('activo');
        const config = await HoneypotConfig.findOne({ where: { guildId: ctx.guild.id } });

        if (active && !config?.channelId) {
            return reply(ctx, errorPanel('Falta el canal', 'Primero corre `/honeypot setup` o `/honeypot channel` para asignar el canal señuelo.'));
        }

        const [row] = await HoneypotConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        row.enabled = active;
        await row.save();
        invalidateCache(ctx.guild.id);

        return reply(ctx, successPanel(active ? 'Honeypot activado' : 'Honeypot desactivado',
            active ? `La trampa está activa en <#${row.channelId}>.` : 'La trampa está apagada. El canal sigue existiendo, pero ya no se castiga a nadie.'));
    },
};
