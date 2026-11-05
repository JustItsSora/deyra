const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { AutomodConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/automod toggle`.');

        const active = ctx.options.getBoolean('activo');
        const [config] = await AutomodConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.enabled = active;
        await config.save();

        return reply(ctx, successPanel('Automod actualizado', `El automod ahora está **${active ? 'activado' : 'desactivado'}**.`));
    },
};
