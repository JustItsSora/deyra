const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/emoji add`.');

        const url = ctx.options.getString('url');
        const name = ctx.options.getString('nombre').replace(/\s+/g, '_').slice(0, 32);

        try {
            const emoji = await ctx.guild.emojis.create({ attachment: url, name });
            return reply(ctx, successPanel('Emoji añadido', `Se añadió ${emoji} como \`:${emoji.name}:\`.`));
        } catch (err) {
            console.error('[emoji add] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude añadir ese emoji. Verifica que la URL sea una imagen válida y de menos de 256KB.'), ephemeral: true });
        }
    },
};
