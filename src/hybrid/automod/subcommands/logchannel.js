const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { AutomodConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/automod logchannel`.');

        const channel = ctx.options.getChannel('canal');
        const [config] = await AutomodConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.logChannelId = channel.id;
        await config.save();

        return reply(ctx, successPanel('Canal de logs actualizado', `Las acciones del automod se registrarán en ${channel}.`));
    },
};
