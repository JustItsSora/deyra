const { reply, isSlash } = require('../../../lib/reply');
const { infoPanel, errorPanel } = require('../../../lib/panel');
const { AutomodConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        const word = isSlash(ctx) ? ctx.options.getString('palabra') : args.join(' ');
        if (!word) {
            return reply(ctx, { ...errorPanel('Falta la palabra', 'Especifica una palabra a probar.'), ephemeral: true });
        }

        const config = await AutomodConfig.findOne({ where: { guildId: ctx.guild.id } });
        const badWords = config ? JSON.parse(config.badWordsList || '[]') : [];
        const triggered = badWords.some(bad => word.toLowerCase().includes(bad));

        return reply(ctx, infoPanel('Prueba de filtro', `"${word}" ${triggered ? 'SÍ activaría' : 'NO activaría'} el filtro de palabras prohibidas.`));
    },
};
