const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { HoneypotConfig } = require('../../../data/models');
const { invalidateCache } = require('../../../gateway/honeypot/honeypotEvents');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/honeypot disable`.');

        await HoneypotConfig.destroy({ where: { guildId: ctx.guild.id } });
        invalidateCache(ctx.guild.id);

        return reply(ctx, successPanel('Honeypot desactivado', 'La configuración se eliminó. El canal señuelo **no** se borra: elimínalo manualmente si ya no lo quieres.'));
    },
};
