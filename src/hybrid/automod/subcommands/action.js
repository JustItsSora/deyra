const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { AutomodConfig } = require('../../../data/models');

const LABELS = { delete: 'Solo borrar', warn: 'Borrar y advertir', mute: 'Borrar y silenciar 10 min', kick: 'Borrar y expulsar', ban: 'Borrar y banear' };

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/automod action`.');

        const action = ctx.options.getString('accion');
        const [config] = await AutomodConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.punishmentAction = action;
        await config.save();

        return reply(ctx, successPanel('Acción actualizada', `Cuando se detecte una infracción: **${LABELS[action]}**.`));
    },
};
