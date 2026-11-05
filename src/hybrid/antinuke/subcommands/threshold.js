const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { AntiNukeConfig } = require('../../../data/models');
const { invalidateCache } = require('../../../gateway/antinuke/antinukeEvents');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/antinuke threshold`.');

        const amount = ctx.options.getInteger('cantidad');
        const [config] = await AntiNukeConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.threshold = amount;
        await config.save();
        invalidateCache(ctx.guild.id);

        return reply(ctx, successPanel('Umbral actualizado', `Se disparará tras **${amount}** acciones sospechosas en la ventana configurada.`));
    },
};
