const { reply, isSlash } = require('../../../lib/reply');
const { infoPanel, errorPanel } = require('../../../lib/panel');
const { Warn } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        const guild = ctx.guild;

        let userId;
        if (isSlash(ctx)) {
            userId = ctx.options.getUser('usuario')?.id;
        } else {
            userId = args[0]?.replace(/[<@!>]/g, '');
        }

        if (!userId) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'Especifica un usuario.'), ephemeral: true });
        }

        const user = await ctx.client.users.fetch(userId).catch(() => null);
        if (!user) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario.'), ephemeral: true });
        }

        const warns = await Warn.findAll({ where: { guildId: guild.id, userId }, order: [['createdAt', 'DESC']], limit: 15 });

        if (warns.length === 0) {
            return reply(ctx, infoPanel(`Advertencias de ${user.tag}`, 'Este usuario no tiene advertencias.'));
        }

        const lines = warns.map(w => `**#${w.id}** — <@${w.moderatorId}> · ${w.reason} · <t:${Math.floor(w.createdAt.getTime() / 1000)}:R>`);

        return reply(ctx, infoPanel(`Advertencias de ${user.tag}`, `Total: **${warns.length}**${warns.length === 15 ? ' (mostrando las 15 más recientes)' : ''}`, { lines }));
    },
};
