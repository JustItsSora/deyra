const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { HoneypotConfig } = require('../../../data/models');
const { formatRotationLabel } = require('../../../lib/honeypot');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/honeypot rotate`.');

        const minutes = ctx.options.getInteger('minutos');
        if (!Number.isFinite(minutes)) return reply(ctx, 'Falta el número de minutos.');
        const [config] = await HoneypotConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.rotationMinutes = Math.min(Math.max(Math.trunc(minutes), 0), 10080);
        await config.save();

        const label = formatRotationLabel(config.rotationMinutes);

        return reply(ctx, successPanel(
            config.rotationMinutes === 0 ? 'Rotación desactivada' : 'Rotación activada',
            config.rotationMinutes === 0
                ? 'El canal señuelo mantendrá su nombre actual.'
                : `El canal señuelo cambiará de nombre ${label} para no volverse predecible.`));
    },
};
