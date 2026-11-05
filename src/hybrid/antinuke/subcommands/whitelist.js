const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { AntiNukeConfig } = require('../../../data/models');
const { invalidateCache } = require('../../../gateway/antinuke/antinukeEvents');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/antinuke whitelist`.');

        const type = ctx.options.getString('tipo');
        const action = ctx.options.getString('accion');

        let targetId = null;
        if (type === 'user') {
            const user = ctx.options.getUser('usuario');
            if (!user) return reply(ctx, errorPanel('Falta el usuario', 'Indica el usuario a excluir con la opción `usuario`.'));
            targetId = user.id;
        } else {
            const role = ctx.options.getRole('rol');
            if (!role) return reply(ctx, errorPanel('Falta el rol', 'Indica el rol a excluir con la opción `rol`.'));
            targetId = role.id;
        }

        const [config] = await AntiNukeConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        const column = type === 'user' ? 'whitelistedUsers' : 'whitelistedRoles';
        const list = JSON.parse(config[column] || '[]');
        const idx = list.indexOf(targetId);

        if (action === 'add') {
            if (idx === -1) list.push(targetId);
        } else {
            if (idx !== -1) list.splice(idx, 1);
        }

        config[column] = JSON.stringify(list);
        await config.save();
        invalidateCache(ctx.guild.id);

        const added = action === 'add';
        const target = type === 'user' ? `<@${targetId}>` : `<@&${targetId}>`;
        return reply(ctx, successPanel(added ? 'Añadido a la lista blanca' : 'Quitado de la lista blanca',
            added
                ? `${target} queda excluido de la detección del anti-nuke.`
                : `${target} vuelve a estar bajo la detección del anti-nuke.`));
    },
};
