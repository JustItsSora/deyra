// src/hybrid/musicconfig/subcommands/ver.js
//
// /musicconfig ver — el estado completo de la música del servidor.

const { reply } = require('../../../lib/reply');
const { infoPanel } = require('../../../lib/panel');
const { getMusicConfig } = require('../../../music/lib/musicConfig');

const fmt = (v) => (v ? 'Activado' : 'Desactivado');

module.exports = {
    async execute(ctx) {
        const settings = await getMusicConfig(ctx.guild.id, { fresh: true });

        const lineas = [
            `**Volumen inicial:** \`${settings.defaultVolume}%\``,
            `**Autoplay por defecto:** ${fmt(settings.defaultAutoplay)}`,
            `**Fairplay:** ${fmt(settings.defaultFairplay)}${settings.fairplayRoleId ? ` — rol <@&${settings.fairplayRoleId}>` : ''}`,
            `**24/7:** ${fmt(settings.twentyFourSeven)}${settings.voice247Id ? ` — canal <#${settings.voice247Id}>` : ''}`,
            `**Panel de reproducción:** ${fmt(settings.nowPlayingPanel)}`,
            `**Historial:** ${fmt(settings.historyEnabled)}`,
            `**Me voy tras:** \`${Math.round(settings.leaveOnEndMs / 1000)}s\` sin reproducir`,
            `**Tope de cola:** \`${settings.maxQueueSize}\` canciones`,
        ];

        const advice = [];
        if (settings.defaultFairplay && !settings.fairplayRoleId) {
            advice.push('El fairplay está activado pero sin rol: no restringe a nadie. Configuralo con `/musicconfig rol`.');
        }
        if (settings.twentyFourSeven && !settings.voice247Id) {
            advice.push('El 24/7 está activado pero sin canal: no hace nada. Prendé `/play` en el canal que quieras y después usá `/twentyfourseven on`.');
        }

        return reply(ctx, infoPanel('Configuración de música', undefined, {
            category: 'configuración',
            lines: lineas,
            ...(advice.length ? { lists: [{ title: 'Falta configurar', items: advice }] } : {}),
        }));
    },
};
