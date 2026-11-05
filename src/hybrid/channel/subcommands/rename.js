const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx, args) {
        const newName = isSlash(ctx) ? ctx.options.getString('nuevo_nombre') : args.join('-');
        if (!newName) {
            return reply(ctx, { ...errorPanel('Falta el nombre', 'Especifica el nuevo nombre del canal.'), ephemeral: true });
        }

        try {
            const oldName = ctx.channel.name;
            await ctx.channel.setName(newName);
            return reply(ctx, successPanel('Canal renombrado', `**#${oldName}** ahora es **#${newName}**.`));
        } catch (err) {
            console.error('[channel rename] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude renombrar este canal.'), ephemeral: true });
        }
    },
};
