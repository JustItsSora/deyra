const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/channel delete`.');

        const channel = ctx.options.getChannel('canal');

        try {
            const name = channel.name;
            await channel.delete();
            return reply(ctx, successPanel('Canal eliminado', `Se eliminó el canal **#${name}**.`));
        } catch (err) {
            console.error('[channel delete] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude eliminar ese canal.'), ephemeral: true });
        }
    },
};
