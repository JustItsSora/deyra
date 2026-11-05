const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/role create`.');

        const name = ctx.options.getString('nombre');
        const colorRaw = ctx.options.getString('color');
        const hoist = ctx.options.getBoolean('mostrar_separado') || false;

        const color = colorRaw && /^#?[0-9a-fA-F]{6}$/.test(colorRaw) ? parseInt(colorRaw.replace('#', ''), 16) : undefined;

        try {
            const role = await ctx.guild.roles.create({ name, color, hoist });
            return reply(ctx, successPanel('Rol creado', `Se creó el rol ${role}.`));
        } catch (err) {
            console.error('[role create] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude crear el rol.'), ephemeral: true });
        }
    },
};
