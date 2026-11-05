const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { GuildConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/config memberlog`.');

        const channel = ctx.options.getChannel('canal');
        const [config] = await GuildConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.memberLogChannelId = channel.id;
        await config.save();

        return reply(ctx, successPanel('Canal de registros de miembros', `Entradas y salidas se registrarán en ${channel}.`));
    },
};
