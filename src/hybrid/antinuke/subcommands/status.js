const { reply, isSlash } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');
const { AntiNukeConfig } = require('../../../data/models');
const { emoji } = require('../../../lib/emojis');

const LABELS = { ban: 'Banear al autor', derank: 'Quitarle todos los roles', log: 'Solo registrar' };

module.exports = {
    async execute(ctx) {
        const config = await AntiNukeConfig.findOne({ where: { guildId: ctx.guild.id } });
        const on = (v) => v ? emoji('TICK_GREEN') : emoji('TICK_RED');

        if (!config) {
            return reply(ctx, infoPanel('Anti-nuke', 'No configurado. Usa `/antinuke toggle activo:true` para activarlo.'));
        }

        const users = JSON.parse(config.whitelistedUsers || '[]');
        const roles = JSON.parse(config.whitelistedRoles || '[]');
        const lines = [
            `**Estado:** ${on(config.enabled)}`,
            `**Acción:** \`${LABELS[config.action] || config.action}\``,
            `**Umbral:** ${config.threshold} acciones en ${config.windowMinutes} min`,
            `**Usuarios excluidos:** ${users.length ? users.map(id => `<@${id}>`).join(', ') : 'ninguno'}`,
            `**Roles excluidos:** ${roles.length ? roles.map(id => `<@&${id}>`).join(', ') : 'ninguno'}`,
            '_Detecta: borrado de canales/roles, baneos masivos, webhooks, bots añadidos y permisos de rol modificados._',
        ];

        return reply(ctx, infoPanel('Configuración anti-nuke', undefined, { lines }));
    },
};
