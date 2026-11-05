const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { AntiNukeConfig } = require('../../../data/models');
const { invalidateCache } = require('../../../gateway/antinuke/antinukeEvents');

const LABELS = { ban: 'Banear al autor', derank: 'Quitarle todos los roles', log: 'Solo registrar' };

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/antinuke action`.');

        const action = ctx.options.getString('accion');
        const [config] = await AntiNukeConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.action = action;
        await config.save();
        invalidateCache(ctx.guild.id);

        return reply(ctx, successPanel('Acción actualizada', `Cuando se detecte la ráfaga: **${LABELS[action]}**.`));
    },
};
