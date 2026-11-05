// src/hybrid/sleeptimer/sleeptimer.js
// NOTA DE FUSIÓN: Deyra ya tenía "/sleep" (comando social de diversión, "irse
// a dormir"). Este es el temporizador de desconexión de música de Valk,
// renombrado a "sleeptimer" para no perder ninguna de las dos funciones.
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MessageFlags } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, warningPanel, infoPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer } = require('../../music/lib/musicChecks');
const config = require('../../config');

function parseDuration(input) {
    const match = input.match(/^(\d+)(m|h)$/i);
    if (!match) return null;
    const value = parseInt(match[1], 10);
    const unit = match[2].toLowerCase();
    return unit === 'm' ? value : value * 60;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sleeptimer')
        .setDescription('Configura un temporizador para que el bot se desconecte de voz tras un tiempo')
        .addStringOption((o) => o.setName('tiempo').setDescription('Ej: 30m, 1h, o "cancel" para cancelar').setRequired(true)),

    name: 'sleeptimer',
    aliases: ['sleepmusic'],
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const client = ctx.client;
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;

        if (!player.queue.current) {
            return reply(ctx, { ...warningPanel('Nada sonando', 'No hay música reproduciéndose.'), ephemeral: true });
        }

        const input = isSlash(ctx) ? ctx.options.getString('tiempo') : args[0];
        const existingTimer = player.data.get('sleepTimer');

        if (input === 'cancel' || input === 'cancelar') {
            if (!existingTimer) {
                return reply(ctx, { ...warningPanel('Sin temporizador', 'No hay ningún temporizador activo.'), ephemeral: true });
            }
            clearTimeout(existingTimer.timeout);
            player.data.delete('sleepTimer');
            return reply(ctx, successPanel('Temporizador cancelado', 'Se canceló el temporizador de desconexión.'));
        }

        if (existingTimer) {
            const timeLeft = Math.ceil((existingTimer.endTime - Date.now()) / 1000 / 60);
            return reply(ctx, { ...infoPanel('Ya hay un temporizador activo', `Faltan **${timeLeft}m**.\nCancelalo con \`/sleeptimer tiempo:cancel\`.`), ephemeral: true });
        }

        if (!input) {
            return reply(ctx, { ...infoPanel('Falta el tiempo', 'Ejemplos: `30m`, `1h`.\nCancelar con `/sleeptimer tiempo:cancel`.'), ephemeral: true });
        }

        const duration = parseDuration(input);
        if (!duration || duration < 1 || duration > 180) {
            return reply(ctx, { ...warningPanel('Duración inválida', 'Usá algo como `30m` o `1h` (entre 1 y 180 minutos).'), ephemeral: true });
        }

        const endTime = Date.now() + duration * 60 * 1000;
        const guildId = ctx.guildId || ctx.guild?.id;
        const userId = isSlash(ctx) ? ctx.user.id : ctx.author.id;
        const userTag = `<@${userId}>`;

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('### ✅ Temporizador configurado'))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(
                new TextDisplayBuilder().setContent(
                    `**Duración:** \`${duration}m\`\n`
                    + `**Termina:** <t:${Math.floor(endTime / 1000)}:t>\n`
                    + '**Acción:** Desconectarse del canal de voz\n\n'
                    + 'Cancelalo con `/sleeptimer tiempo:cancel`',
                ),
            );

        await reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });

        const timeout = setTimeout(async () => {
            try {
                const guild = client.guilds.cache.get(guildId);
                const member = guild?.members.cache.get(userId);

                if (member?.voice?.channel) {
                    await member.voice.disconnect('Temporizador de sueño finalizado').catch(() => {});
                    const textChannel = client.channels.cache.get(player.textId);
                    if (textChannel) {
                        textChannel.send(infoPanel('Temporizador finalizado', `Se desconectó a ${userTag}.`)).catch(() => {});
                    }
                }
            } catch (_) {}
            player.data.delete('sleepTimer');
        }, duration * 60 * 1000);

        player.data.set('sleepTimer', { timeout, endTime, startedBy: userId });
    },
};
