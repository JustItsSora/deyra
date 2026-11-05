const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { AntiNukeConfig } = require('../../../data/models');
const { invalidateCache } = require('../../../gateway/antinuke/antinukeEvents');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/antinuke window`.');

        const minutes = ctx.options.getInteger('minutos');
        const [config] = await AntiNukeConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.windowMinutes = minutes;
        await config.save();
        invalidateCache(ctx.guild.id);

        return reply(ctx, successPanel('Ventana actualizada', `Las acciones se contarán en una ventana de **${minutes}** minuto(s).`));
    },
};
