const { reply } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');
const { AutomodConfig } = require('../../../data/models');
const { emoji } = require('../../../lib/emojis');

module.exports = {
    async execute(ctx) {
        const config = await AutomodConfig.findOne({ where: { guildId: ctx.guild.id } });
        if (!config) {
            return reply(ctx, infoPanel('Automod', 'El automod no ha sido configurado todavía. Usa `/automod toggle activo:true` para empezar.'));
        }

        const on = (v) => v ? emoji('TICK_GREEN') : emoji('TICK_RED');
        const lines = [
            `**Estado general:** ${on(config.enabled)}`,
            `**Anti-invitaciones:** ${on(config.antiInvite)}`,
            `**Anti-enlaces:** ${on(config.antiLink)}`,
            `**Anti-spam:** ${on(config.antiSpam)}`,
            `**Anti-menciones masivas:** ${on(config.antiMention)} (máx ${config.maxMentions})`,
            `**Anti-mayúsculas:** ${on(config.antiCaps)} (umbral ${config.capsPercentThreshold}%)`,
            `**Palabras prohibidas:** ${on(config.antiBadWords)} (${JSON.parse(config.badWordsList || '[]').length} palabra(s))`,
            `**Acción al detectar:** \`${config.punishmentAction}\``,
            `**Escalada (30 días):** ${config.escalationAction === 'off' ? 'desactivada' : `\`${config.escalationAction}\` al llegar a ${config.escalationThreshold}`}`,
            `**Dominios permitidos:** ${JSON.parse(config.linkAllowlist || '[]').length}`,
            `**Canal de logs:** ${config.logChannelId ? `<#${config.logChannelId}>` : 'No configurado'}`,
        ];

        return reply(ctx, infoPanel('Configuración de Automod', undefined, { lines }));
    },
};
