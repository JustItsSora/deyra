const { reply } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');
const { GuildConfig } = require('../../../data/models');
const config = require('../../../config');

module.exports = {
    async execute(ctx) {
        const guildConfig = await GuildConfig.findOne({ where: { guildId: ctx.guild.id } });

        const lines = [
            `**Prefijo:** \`${guildConfig?.prefix || config.PREFIX}\``,
            `**Canal de logs de moderación:** ${guildConfig?.modLogChannelId ? `<#${guildConfig.modLogChannelId}>` : 'No configurado'}`,
            `**Canal de logs de miembros:** ${guildConfig?.memberLogChannelId ? `<#${guildConfig.memberLogChannelId}>` : 'No configurado'}`,
            `**Canal de logs de mensajes:** ${guildConfig?.messageLogChannelId ? `<#${guildConfig.messageLogChannelId}>` : 'No configurado'}`,
            `**Rol de silencio:** ${guildConfig?.muteRoleId ? `<@&${guildConfig.muteRoleId}>` : 'No configurado'}`,
            `**Canal de sugerencias:** ${guildConfig?.suggestionsChannelId ? `<#${guildConfig.suggestionsChannelId}>` : 'No configurado'}`,
            `**Canal de confesiones:** ${guildConfig?.confessionsChannelId ? `<#${guildConfig.confessionsChannelId}>` : 'No configurado'}`,
            `**Canal de cumpleaños:** ${guildConfig?.birthdayChannelId ? `<#${guildConfig.birthdayChannelId}>` : 'No configurado'}`,
        ];

        return reply(ctx, infoPanel('⚙️ Configuración del servidor', undefined, { lines }));
    },
};
