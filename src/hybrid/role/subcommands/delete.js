const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/role delete`.');

        const role = ctx.options.getRole('rol');
        if (ctx.guild.members.me.roles.highest.position <= role.position) {
            return reply(ctx, { ...errorPanel('No puedo hacer eso', 'Ese rol está por encima o al mismo nivel que mi rol más alto.'), ephemeral: true });
        }

        try {
            await role.delete();
            return reply(ctx, successPanel('Rol eliminado', `Se eliminó el rol **${role.name}**.`));
        } catch (err) {
            console.error('[role delete] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude eliminar ese rol.'), ephemeral: true });
        }
    },
};
