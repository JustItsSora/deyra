const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { AutoRole } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/autorole add`.');

        const role = ctx.options.getRole('rol');
        const botOnly = ctx.options.getBoolean('solo_bots') || false;

        if (role.managed) {
            return reply(ctx, { ...errorPanel('Rol inválido', 'No puedes usar un rol gestionado por una integración (como el rol de un bot).'), ephemeral: true });
        }

        const [config] = await AutoRole.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        const field = botOnly ? 'botRoleIds' : 'roleIds';
        const list = JSON.parse(config[field] || '[]');

        if (list.includes(role.id)) {
            return reply(ctx, { ...errorPanel('Ya existe', 'Ese rol ya está configurado.'), ephemeral: true });
        }

        list.push(role.id);
        config[field] = JSON.stringify(list);
        await config.save();

        return reply(ctx, successPanel('Autorole añadido', `${role} se asignará automáticamente a ${botOnly ? 'bots' : 'nuevos miembros'}.`));
    },
};
