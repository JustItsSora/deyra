const { reply } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx) {
        const bans = await ctx.guild.bans.fetch();
        if (bans.size === 0) {
            return reply(ctx, infoPanel('Lista de baneados', 'No hay usuarios baneados en este servidor.'));
        }

        const lines = [...bans.values()].slice(0, 30).map(b => `**${b.user.tag}** (${b.user.id})${b.reason ? ` — ${b.reason}` : ''}`);
        return reply(ctx, infoPanel(`Usuarios baneados (${bans.size})`, undefined, { lines }));
    },
};
