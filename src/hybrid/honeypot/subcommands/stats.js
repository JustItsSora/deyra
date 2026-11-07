const { reply, isSlash } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');
const { HoneypotConfig } = require('../../../data/models');
const { emoji } = require('../../../lib/emojis');
const { formatRotationLabel } = require('../../../lib/honeypot');

const LABELS = { timeout: 'Silenciar (timeout)', kick: 'Expulsar (kick)', ban: 'Banear (ban)' };

module.exports = {
    async execute(ctx) {
        const config = await HoneypotConfig.findOne({ where: { guildId: ctx.guild.id } });
        const on = (v) => v ? emoji('TICK_GREEN') : emoji('TICK_RED');

        if (!config) {
            return reply(ctx, infoPanel('Honeypot', 'No hay señuelo configurado. Usa `/honeypot setup` para crear uno.'));
        }

        const lines = [
            `**Estado:** ${on(config.enabled)}`,
            `**Canal:** ${config.channelId ? `<#${config.channelId}>` : 'No asignado'}`,
            `**Castigos aplicados:** ${config.caughtCount || 0}`,
            `**Auto-purge del canal:** ${on(config.autoPurge)}`,
            `**Rotación de nombre:** ${formatRotationLabel(config.rotationMinutes)}`,
            `**Última rotación:** ${config.lastRotationAt ? `<t:${Math.floor(new Date(config.lastRotationAt).getTime() / 1000)}:R>` : 'nunca'}`,
            `**Acción:** \`${LABELS[config.action] || config.action}\``,
        ];

        return reply(ctx, infoPanel('Estadísticas del señuelo', undefined, { lines }));
    },
};
