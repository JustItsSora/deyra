const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/role mentionable`.');

        const role = ctx.options.getRole('rol');
        const active = ctx.options.getBoolean('activo');

        try {
            await role.setMentionable(active);
            return reply(ctx, successPanel('Rol actualizado', `${role} ahora es ${active ? 'mencionable' : 'no mencionable'}.`));
        } catch (err) {
            console.error('[role mentionable] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude cambiar esa propiedad del rol.'), ephemeral: true });
        }
    },
};
