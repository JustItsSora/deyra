const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { Birthday } = require('../../../data/models');

const DAYS_IN_MONTH = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

module.exports = {
    async execute(ctx, args) {
        let day, month;
        if (isSlash(ctx)) {
            day = ctx.options.getInteger('dia');
            month = ctx.options.getInteger('mes');
        } else {
            day = parseInt(args[0], 10);
            month = parseInt(args[1], 10);
        }

        if (!day || !month || day > DAYS_IN_MONTH[month - 1]) {
            return reply(ctx, { ...errorPanel('Fecha inválida', 'Especifica un día y mes válidos.'), ephemeral: true });
        }

        const userId = getUserId(ctx);
        await Birthday.upsert({ guildId: ctx.guild.id, userId, day, month });

        return reply(ctx, successPanel('Cumpleaños registrado', `Tu cumpleaños quedó registrado como **${day}/${month}**.`));
    },
};
