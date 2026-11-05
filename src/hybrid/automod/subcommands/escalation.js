const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { AutomodConfig } = require('../../../data/models');

const LABELS = { off: 'Desactivada', timeout: 'Silenciar 1 hora', kick: 'Expulsar', ban: 'Banear' };

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/automod escalation`.');

        const action = ctx.options.getString('accion');
        const threshold = ctx.options.getInteger('umbral');

        const [config] = await AutomodConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.escalationAction = action;
        if (threshold !== null) {
            config.escalationThreshold = Math.min(Math.max(threshold, 1), 100);
        }
        await config.save();

        const detail = action === 'off'
            ? 'Los usuarios acumulan infracciones sin sanción mayor.'
            : `Al llegar a **${config.escalationThreshold}** infracciones en 30 días: **${LABELS[action]}**.`;

        return reply(ctx, successPanel('Escalada actualizada', detail));
    },
};
