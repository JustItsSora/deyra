// src/hybrid/twentyfourseven/twentyfourseven.js
//
// Atajo al 24/7. Todo el trabajo real está en /musicconfig 247 (subcomando
// veintycuatro.js); este comando existe porque "24/7" es una palabra que la
// gente escribe, no "/musicconfig 247".
//
// La diferencia con el /247 del bot de música viejo: aquel creaba o exigía un
// canal dedicado y guardaba sus ids. Acá el 24/7 se aplica al canal donde el
// reproductor YA está conectado, que es lo que la gente quiere ("dejalo
// sonando acá") y evita mantener un canal Stage que nadie ve.
//
// El nombre del comando no puede ser "24/7" (Discord no acepta "/" en nombres
// de comando), por eso el comando se llama twentyfourseven y los alias son las
// formas en que se escribe: 247, 24/7, siempreon.

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, errorPanel, warningPanel } = require('../../lib/panel');
const { requireMusic } = require('../../music/lib/musicChecks');
const { getMusicConfig, updateMusicConfig, applySettingsToPlayer } = require('../../music/lib/musicConfig');

function estado(ctx, args) {
    const raw = isSlash(ctx) ? ctx.options.getString('accion') : (args[0] || '').toLowerCase();
    if (['on', 'si', 'sí', 'true', 'activar', 'enable', '1', 'go'].includes(raw)) return true;
    if (['off', 'no', 'false', 'desactivar', 'disable', '0', 'stop'].includes(raw)) return false;
    return null;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('twentyfourseven')
        .setDescription('Deja al bot sonando solo en el canal donde está (24/7)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(o => o.setName('accion')
            .setDescription('Activar, desactivar o consultar el estado')
            .setRequired(true)
            .addChoices(
                { name: 'Activar', value: 'on' },
                { name: 'Desactivar', value: 'off' },
                { name: 'Ver estado', value: 'estado' },
            )),

    name: 'twentyfourseven',
    aliases: ['247', '24/7', 'siempreon', 'afk247'],
    category: 'música',

    async execute(ctx, args = []) {
        if (!requireMusic(ctx)) return;

        const accion = estado(ctx, args);
        const settings = await getMusicConfig(ctx.guild.id, { fresh: true });

        // ── consulta o apagado ──────────────────────────────────────────────
        if (accion === null || accion === false) {
            if (accion === false) {
                await updateMusicConfig(ctx.guild.id, { twentyFourSeven: false, voice247Id: null, text247Id: null });
                const player = ctx.client.music?.players?.get(ctx.guild.id);
                if (player) applySettingsToPlayer(player, await getMusicConfig(ctx.guild.id, { fresh: true }));

                return reply(ctx, successPanel(
                    '24/7 desactivado',
                    'El bot se va a desconectar normalmente cuando termine la cola.',
                ));
            }

            return reply(ctx, warningPanel(
                'Estado del 24/7',
                settings.twentyFourSeven && settings.voice247Id
                    ? `**Activado** en <#${settings.voice247Id}>. Sigo sonando aunque no haya nadie.`
                    : '**Desactivado.** Con esto me quedo solo en un canal y sigo reproduciendo aunque el server esté vacío.',
                {
                    lines: [
                        '`/twentyfourseven on` para activarlo en el canal donde estoy ahora.',
                        '`/twentyfourseven off` para apagarlo.',
                    ],
                },
            ));
        }

        // ── activar ─────────────────────────────────────────────────────────
        const player = ctx.client.music?.players?.get(ctx.guild.id);
        if (!player) {
            return reply(ctx, {
                ...errorPanel(
                    'No hay reproductor',
                    'Para activar el 24/7 necesito un canal donde quedar. Poné `/play` en ese canal y después volvé a ejecutar esto.',
                ),
                ephemeral: true,
            });
        }

        const channel = ctx.guild.channels.cache.get(player.voiceId)
            || await ctx.guild.channels.fetch(player.voiceId).catch(() => null);

        if (!channel) {
            return reply(ctx, {
                ...errorPanel('No encuentro el canal', 'El canal donde estoy conectado ya no existe. Conectame de nuevo con `/play`.'),
                ephemeral: true,
            });
        }

        await updateMusicConfig(ctx.guild.id, {
            twentyFourSeven: true,
            voice247Id: player.voiceId,
            text247Id: ctx.channelId || ctx.channel?.id,
        });
        applySettingsToPlayer(player, await getMusicConfig(ctx.guild.id, { fresh: true }));

        return reply(ctx, successPanel(
            '24/7 activado',
            `Me quedo en ${channel} y sigo reproduciendo aunque no haya nadie.`,
            {
                lines: [
                    `Avisos van a <#${ctx.channelId || ctx.channel?.id}>.`,
                    'Apagalo con `/twentyfourseven off` cuando quieras.',
                ],
            },
        ));
    },
};
