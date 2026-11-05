const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { AutomodConfig } = require('../../../data/models');

const LABELS = {
    antiInvite: 'Invitaciones de Discord',
    antiLink: 'Enlaces',
    antiSpam: 'Spam',
    antiMention: 'Menciones masivas',
    antiCaps: 'Mayúsculas excesivas',
    antiBadWords: 'Palabras prohibidas',
};

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/automod feature`.');

        const feature = ctx.options.getString('proteccion');
        const active = ctx.options.getBoolean('activo');

        const [config] = await AutomodConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config[feature] = active;
        await config.save();

        return reply(ctx, successPanel('Protección actualizada', `**${LABELS[feature]}** ahora está **${active ? 'activada' : 'desactivada'}**.`));
    },
};
