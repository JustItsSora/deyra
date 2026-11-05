const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx, args) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el nuevo tema del canal.'), ephemeral: true });
        }

        try {
            await ctx.channel.setTopic(text);
            return reply(ctx, successPanel('Tema actualizado', `El tema de este canal ahora es: "${text}"`));
        } catch (err) {
            console.error('[channel topic] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude cambiar el tema de este canal.'), ephemeral: true });
        }
    },
};
