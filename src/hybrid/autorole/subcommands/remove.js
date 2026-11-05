const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { AutoRole } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/autorole remove`.');

        const role = ctx.options.getRole('rol');
        const config = await AutoRole.findOne({ where: { guildId: ctx.guild.id } });
        if (!config) {
            return reply(ctx, { ...errorPanel('No configurado', 'No hay roles automáticos configurados.'), ephemeral: true });
        }

        let removed = false;
        for (const field of ['roleIds', 'botRoleIds']) {
            const list = JSON.parse(config[field] || '[]');
            const idx = list.indexOf(role.id);
            if (idx !== -1) {
                list.splice(idx, 1);
                config[field] = JSON.stringify(list);
                removed = true;
            }
        }

        if (!removed) {
            return reply(ctx, { ...errorPanel('No encontrado', 'Ese rol no estaba configurado como autorole.'), ephemeral: true });
        }

        await config.save();
        return reply(ctx, successPanel('Autorole eliminado', `${role} ya no se asignará automáticamente.`));
    },
};
