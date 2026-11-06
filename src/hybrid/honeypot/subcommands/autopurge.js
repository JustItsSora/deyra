const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { HoneypotConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/honeypot autopurge`.');

        const active = ctx.options.getBoolean('activo');
        const [config] = await HoneypotConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.autoPurge = active;
        await config.save();

        return reply(ctx, successPanel(
            active ? 'Auto-purge activado' : 'Auto-purge desactivado',
            active
                ? 'Al caer en el señuelo se borrarán sus mensajes recientes en ese canal.'
                : 'Los mensajes de quien caiga se conservan.'));
    },
};
