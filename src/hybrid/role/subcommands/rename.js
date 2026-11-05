const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/role rename`.');

        const role = ctx.options.getRole('rol');
        const newName = ctx.options.getString('nuevo_nombre');

        try {
            const oldName = role.name;
            await role.setName(newName);
            return reply(ctx, successPanel('Rol renombrado', `**${oldName}** ahora se llama **${newName}**.`));
        } catch (err) {
            console.error('[role rename] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude renombrar ese rol.'), ephemeral: true });
        }
    },
};
