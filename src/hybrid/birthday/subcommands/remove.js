const { reply, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { Birthday } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        const userId = getUserId(ctx);
        const deleted = await Birthday.destroy({ where: { guildId: ctx.guild.id, userId } });

        if (!deleted) {
            return reply(ctx, { ...errorPanel('No registrado', 'No tenías un cumpleaños registrado.'), ephemeral: true });
        }

        return reply(ctx, successPanel('Cumpleaños eliminado', 'Se eliminó tu fecha de cumpleaños.'));
    },
};
