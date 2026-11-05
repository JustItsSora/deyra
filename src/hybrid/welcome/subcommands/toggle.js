const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { WelcomeConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/welcome toggle`.');

        const type = ctx.options.getString('tipo');
        const active = ctx.options.getBoolean('activo');

        const [config] = await WelcomeConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        if (type === 'welcome') config.welcomeEnabled = active;
        else config.leaveEnabled = active;
        await config.save();

        return reply(ctx, successPanel('Configuración actualizada', `${type === 'welcome' ? 'Bienvenidas' : 'Despedidas'} ahora están **${active ? 'activadas' : 'desactivadas'}**.`));
    },
};
