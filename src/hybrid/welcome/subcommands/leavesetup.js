const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { WelcomeConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/welcome leavesetup`.');

        const channel = ctx.options.getChannel('canal');
        const message = ctx.options.getString('mensaje');

        const [config] = await WelcomeConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.leaveChannelId = channel.id;
        config.leaveEnabled = true;
        if (message) config.leaveMessage = message;
        await config.save();

        return reply(ctx, successPanel('Despedida configurada', `Las despedidas se enviarán en ${channel}.\n\nPlaceholders disponibles: \`{user}\`, \`{server}\`, \`{membercount}\`.`));
    },
};
