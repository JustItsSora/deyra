const { reply } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx) {
        const guild = ctx.guild;
        const lines = [
            `**Nivel de verificación:** ${guild.verificationLevel}`,
            `**Filtro de contenido explícito:** ${guild.explicitContentFilter}`,
            `**Canal del sistema:** ${guild.systemChannel || 'No configurado'}`,
            `**Canal de reglas:** ${guild.rulesChannel || 'No configurado'}`,
            `**Notificaciones por defecto:** ${guild.defaultMessageNotifications}`,
        ];

        return reply(ctx, infoPanel('⚙️ Configuración nativa del servidor', undefined, { lines }));
    },
};
