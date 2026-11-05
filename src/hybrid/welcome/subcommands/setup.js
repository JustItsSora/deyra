const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { WelcomeConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/welcome setup`.');

        const channel = ctx.options.getChannel('canal');
        const message = ctx.options.getString('mensaje');

        const [config] = await WelcomeConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.welcomeChannelId = channel.id;
        config.welcomeEnabled = true;
        if (message) config.welcomeMessage = message;
        await config.save();

        return reply(ctx, successPanel('Bienvenida configurada', `Los nuevos miembros serán recibidos en ${channel}.\n\nPlaceholders disponibles: \`{user}\`, \`{server}\`, \`{membercount}\`.`));
    },
};
