const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { HoneypotConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/honeypot rotate`.');

        const hours = ctx.options.getInteger('horas');
        const [config] = await HoneypotConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.rotationHours = Math.min(Math.max(hours, 0), 168);
        await config.save();

        return reply(ctx, successPanel(
            config.rotationHours === 0 ? 'Rotación desactivada' : 'Rotación activada',
            config.rotationHours === 0
                ? 'El canal señuelo mantendrá su nombre actual.'
                : `El canal señuelo cambiará de nombre cada **${config.rotationHours}** hora(s) para no volverse predecible.`));
    },
};
