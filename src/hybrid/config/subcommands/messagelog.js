const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { GuildConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/config messagelog`.');

        const channel = ctx.options.getChannel('canal');
        const [config] = await GuildConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.messageLogChannelId = channel.id;
        await config.save();

        return reply(ctx, successPanel('Canal de registros de mensajes', `Eliminaciones y ediciones se registrarán en ${channel}.`));
    },
};
