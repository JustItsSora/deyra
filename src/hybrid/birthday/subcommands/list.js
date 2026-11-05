const { reply } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');
const { Birthday } = require('../../../data/models');

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

module.exports = {
    async execute(ctx) {
        const birthdays = await Birthday.findAll({ where: { guildId: ctx.guild.id } });

        if (birthdays.length === 0) {
            return reply(ctx, infoPanel('Cumpleaños', 'Nadie ha registrado su cumpleaños todavía. Usa `/birthday set`.'));
        }

        const today = new Date();
        const sorted = [...birthdays].sort((a, b) => {
            const diffA = ((a.month - 1 - today.getMonth()) * 31 + (a.day - today.getDate()) + 372) % 372;
            const diffB = ((b.month - 1 - today.getMonth()) * 31 + (b.day - today.getDate()) + 372) % 372;
            return diffA - diffB;
        });

        const lines = sorted.slice(0, 20).map(b => `<@${b.userId}> — ${b.day} de ${MONTH_NAMES[b.month - 1]}`);
        return reply(ctx, infoPanel('🎂 Próximos cumpleaños', undefined, { lines }));
    },
};
