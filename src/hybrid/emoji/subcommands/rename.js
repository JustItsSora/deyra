const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx, args) {
        let currentName, newName;
        if (isSlash(ctx)) {
            currentName = ctx.options.getString('nombre_actual');
            newName = ctx.options.getString('nuevo_nombre');
        } else {
            [currentName, newName] = args;
        }

        if (!currentName || !newName) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Especifica el nombre actual y el nuevo nombre.'), ephemeral: true });
        }

        const emoji = ctx.guild.emojis.cache.find(e => e.name === currentName);
        if (!emoji) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No existe un emoji con ese nombre.'), ephemeral: true });
        }

        try {
            await emoji.setName(newName.replace(/\s+/g, '_').slice(0, 32));
            return reply(ctx, successPanel('Emoji renombrado', `\`:${currentName}:\` ahora es \`:${emoji.name}:\`.`));
        } catch (err) {
            console.error('[emoji rename] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude renombrar ese emoji.'), ephemeral: true });
        }
    },
};
