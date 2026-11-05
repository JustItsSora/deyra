const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx, args) {
        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args[0];
        if (!name) {
            return reply(ctx, { ...errorPanel('Falta el nombre', 'Especifica el nombre del emoji a eliminar.'), ephemeral: true });
        }

        const emoji = ctx.guild.emojis.cache.find(e => e.name === name);
        if (!emoji) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No existe un emoji con ese nombre en este servidor.'), ephemeral: true });
        }

        try {
            await emoji.delete();
            return reply(ctx, successPanel('Emoji eliminado', `Se eliminó el emoji \`:${name}:\`.`));
        } catch (err) {
            console.error('[emoji remove] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude eliminar ese emoji.'), ephemeral: true });
        }
    },
};
