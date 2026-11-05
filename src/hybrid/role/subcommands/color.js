const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/role color`.');

        const role = ctx.options.getRole('rol');
        const colorRaw = ctx.options.getString('color');

        if (!/^#?[0-9a-fA-F]{6}$/.test(colorRaw)) {
            return reply(ctx, { ...errorPanel('Color inválido', 'Usa un formato HEX válido, ej: `#2B7FFF`.'), ephemeral: true });
        }

        try {
            await role.setColor(colorRaw.startsWith('#') ? colorRaw : `#${colorRaw}`);
            return reply(ctx, successPanel('Color actualizado', `${role} ahora tiene el color ${colorRaw}.`));
        } catch (err) {
            console.error('[role color] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude cambiar el color de ese rol.'), ephemeral: true });
        }
    },
};
