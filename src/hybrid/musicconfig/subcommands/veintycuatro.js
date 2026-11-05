// src/hybrid/musicconfig/subcommands/veintycuatro.js
//
// /musicconfig 247 — modo 24/7.
//
// El bot se queda solo en un canal de voz y sigue sonando aunque no haya nadie.
//
// Cómo funciona acá, y por qué es distinto al del bot viejo:
//
//   · NO es un canal dedicado que se crea solo. Es el canal donde el player ya
//     está conectado. Eso evita duplicar lo que Discord ya te da (un canal
//     "AFK" que nadie ve, o un canal Stage que hay que mantenerStage-aware) y
//     evita el caso raro del bot recuperar una sesión en un canal que alguien
//     borró mientras dormía.
//   · Queda en la base (music_configs.voice247Id) y un cron cada 15 minutos lo
//     revive si se cayó (nodo de Lavalink reiniciado, bot reiniciado).
//   · Si el canal desaparece, el 24/7 se desactiva solo (ver playerEmpty.js) en
//     vez de intentar revivir un canal fantasma para siempre.

const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, warningPanel, errorPanel } = require('../../../lib/panel');
const { updateMusicConfig, getMusicConfig, applySettingsToPlayer } = require('../../../music/lib/musicConfig');

function parseState(args) {
    const value = (args[0] || '').toLowerCase();
    if (['on', 'si', 'sí', 'true', 'activar', 'enable', '1'].includes(value)) return true;
    if (['off', 'no', 'false', 'desactivar', 'disable', '0'].includes(value)) return false;
    return null;
}

module.exports = {
    async execute(ctx, args = []) {
        const state = parseState(args);

        if (state === null) {
            const settings = await getMusicConfig(ctx.guild.id, { fresh: true });
            const player = ctx.client.music?.players?.get(ctx.guild.id);

            return reply(ctx, warningPanel(
                'Modo 24/7',
                settings.twentyFourSeven && settings.voice247Id
                    ? `Está **activado** en <#${settings.voice247Id}>. El bot se queda solo y sigue reproduciendo.`
                    : 'Está **desactivado**. Con esto el bot se queda solo en un canal de voz y sigue sonando aunque el server esté vacío.',
                {
                    lines: [
                        'Uso: `/musicconfig 247 on` para activarlo en el canal donde estoy, `/musicconfig 247 off` para apagarlo.',
                        player ? `Ahora mismo estoy en <#${player.voiceId}>.` : 'No hay ningún reproductor activo: poné `/play` en el canal que quieras dejar 24/7 primero.',
                    ],
                },
            ));
        }

        if (!state) {
            await updateMusicConfig(ctx.guild.id, {
                twentyFourSeven: false,
                voice247Id: null,
                text247Id: null,
            });

            const player = ctx.client.music?.players?.get(ctx.guild.id);
            if (player) {
                applySettingsToPlayer(player, { ...(await getMusicConfig(ctx.guild.id, { fresh: true })) });
            }

            return reply(ctx, successPanel(
                '24/7 desactivado',
                'El bot se va a desconectar normalmente cuando termine la cola.',
            ));
        }

        const player = ctx.client.music?.players?.get(ctx.guild.id);
        if (!player) {
            return reply(ctx, {
                ...errorPanel(
                    'No hay reproductor',
                    'Para activar el 24/7 necesito un canal donde quedar. Poné `/play` en ese canal primero y después volvé a ejecutar esto.',
                ),
                ephemeral: true,
            });
        }

        // El player tiene que estar en un canal de voz real, no stage.
        const channel = ctx.guild.channels.cache.get(player.voiceId)
            || await ctx.guild.channels.fetch(player.voiceId).catch(() => null);

        if (!channel) {
            return reply(ctx, {
                ...errorPanel('No encuentro el canal', 'El canal donde estoy conectado ya no existe. Conectame de nuevo con `/play`.'),
                ephemeral: true,
            });
        }

        const textChannel = ctx.channelId || ctx.channel?.id;
        await updateMusicConfig(ctx.guild.id, {
            twentyFourSeven: true,
            voice247Id: player.voiceId,
            text247Id: textChannel,
        });

        const settings = await getMusicConfig(ctx.guild.id, { fresh: true });
        applySettingsToPlayer(player, settings);

        return reply(ctx, successPanel(
            '24/7 activado',
            `Me quedo en ${channel} y sigo reproduciendo aunque no haya nadie.`,
            {
                lines: [
                    `Avisos de cola finalizada van a <#${textChannel}>.`,
                    'Para desactivarlo: `/musicconfig 247 off` o `/twentyfourseven off`.',
                ],
            },
        ));
    },
};
