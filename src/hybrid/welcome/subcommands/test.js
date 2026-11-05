const { reply, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel, infoPanel } = require('../../../lib/panel');
const { WelcomeConfig } = require('../../../data/models');
const { fillPlaceholders } = require('../../../lib/placeholders');

module.exports = {
    async execute(ctx) {
        const config = await WelcomeConfig.findOne({ where: { guildId: ctx.guild.id } });
        if (!config?.welcomeChannelId) {
            return reply(ctx, { ...errorPanel('No configurado', 'Primero configura la bienvenida con `/welcome setup`.'), ephemeral: true });
        }

        const channel = await ctx.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
        if (!channel) {
            return reply(ctx, { ...errorPanel('Canal no disponible', 'El canal configurado ya no existe.'), ephemeral: true });
        }

        const member = ctx.member;
        const text = fillPlaceholders(config.welcomeMessage || '¡Bienvenido/a {user} a {server}!', { member, guild: ctx.guild });
        await channel.send({ content: `${member}`, ...infoPanel('👋 ¡Nuevo miembro! (prueba)', text) }).catch(() => {});

        return reply(ctx, { ...successPanel('Prueba enviada', `Revisa ${channel}.`), ephemeral: true });
    },
};
