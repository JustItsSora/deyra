const { reply, isSlash } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');
const { HoneypotConfig } = require('../../../data/models');
const { emoji } = require('../../../lib/emojis');

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
            `**Auto-purge:** ${on(config.autoPurge)}`,
            `**Rotación:** ${config.rotationHours > 0 ? `cada ${config.rotationHours}h` : 'desactivada'}`,
            `**Acción:** \`${LABELS[config.action] || config.action}\``,
            config.action === 'timeout' ? `**Duración del silencio:** ${config.timeoutMinutes} minutos` : null,
        ].filter(Boolean);

        return reply(ctx, infoPanel('Configuración del señuelo', undefined, { lines }));
    },
};
