const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { AutomodConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        let action, word;
        if (isSlash(ctx)) {
            action = ctx.options.getString('accion');
            word = ctx.options.getString('palabra')?.toLowerCase().trim();
        } else {
            action = args[0]?.toLowerCase();
            word = args.slice(1).join(' ').toLowerCase().trim();
        }

        if (!word) {
            return reply(ctx, { ...errorPanel('Falta la palabra', 'Especifica una palabra.'), ephemeral: true });
        }

        const [config] = await AutomodConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        const list = JSON.parse(config.badWordsList || '[]');

        if (action === 'add') {
            if (list.includes(word)) {
                return reply(ctx, { ...errorPanel('Ya existe', 'Esa palabra ya está en la lista.'), ephemeral: true });
            }
            list.push(word);
        } else {
            const idx = list.indexOf(word);
            if (idx === -1) {
                return reply(ctx, { ...errorPanel('No existe', 'Esa palabra no está en la lista.'), ephemeral: true });
            }
            list.splice(idx, 1);
        }

        config.badWordsList = JSON.stringify(list);
        await config.save();

        return reply(ctx, { ...successPanel('Lista actualizada', `Palabra ${action === 'add' ? 'añadida' : 'quitada'}. Total: **${list.length}** palabra(s).`), ephemeral: true });
    },
};
