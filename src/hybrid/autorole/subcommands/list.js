const { reply } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');
const { AutoRole } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        const config = await AutoRole.findOne({ where: { guildId: ctx.guild.id } });
        const roles = config ? JSON.parse(config.roleIds || '[]') : [];
        const botRoles = config ? JSON.parse(config.botRoleIds || '[]') : [];

        if (roles.length === 0 && botRoles.length === 0) {
            return reply(ctx, infoPanel('Autoroles', 'No hay roles automáticos configurados.'));
        }

        const lines = [];
        if (roles.length > 0) lines.push('**Para nuevos miembros:**', ...roles.map(id => `<@&${id}>`));
        if (botRoles.length > 0) lines.push('', '**Para bots:**', ...botRoles.map(id => `<@&${id}>`));

        return reply(ctx, infoPanel('Autoroles configurados', undefined, { lines }));
    },
};
