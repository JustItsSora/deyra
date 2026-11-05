// src/hybrid/volume/volume.js
const { SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply, isSlash, getUserId, replyAndGetMessage } = require('../../lib/reply');
const { successPanel, warningPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');
const config = require('../../config');

function buildContainer(vol) {
    return new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`### 🔊 Volumen\n**Actual:** \`${vol}%\``))
        .addActionRowComponents(
            new ActionRowBuilder().addComponents(
                new ButtonBuilder().setCustomId('vol_minus').setLabel('-10').setStyle(ButtonStyle.Secondary).setDisabled(vol <= 0),
                new ButtonBuilder().setCustomId('vol_plus').setLabel('+10').setStyle(ButtonStyle.Secondary).setDisabled(vol >= 100),
            ),
        );
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('volume')
        .setDescription('Consulta o cambia el volumen de reproducción (0-100)')
        .addIntegerOption((o) => o.setName('valor').setDescription('Nuevo volumen (0-100)').setMinValue(0).setMaxValue(100)),

    name: 'volume',
    aliases: ['vol'],
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const client = ctx.client;
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;
        if (!requireSameVoiceChannel(ctx, player)) return;

        if (!player.queue.current) {
            return reply(ctx, { ...warningPanel('Nada sonando', 'Poné una canción primero.'), ephemeral: true });
        }

        const volumeInput = isSlash(ctx) ? ctx.options.getInteger('valor') : (args[0] ? Number(args[0]) : null);

        if (volumeInput !== null && volumeInput !== undefined) {
            if (Number.isNaN(volumeInput) || volumeInput < 0 || volumeInput > 100) {
                return reply(ctx, { ...warningPanel('Valor inválido', `Usá un valor entre \`0\` y \`100\`.\nVolumen actual: \`${player.volume}%\`.`), ephemeral: true });
            }

            await player.setVolume(volumeInput);
            return reply(ctx, successPanel('Volumen actualizado', `El volumen quedó en \`${volumeInput}%\`.`));
        }

        const payload = { components: [buildContainer(player.volume)], flags: MessageFlags.IsComponentsV2 };
        const volMsg = await replyAndGetMessage(ctx, payload);

        if (!volMsg) return;

        const userId = getUserId(ctx);
        const guildId = ctx.guildId || ctx.guild?.id;
        const collector = volMsg.createMessageComponentCollector({
            filter: (i) => i.user.id === userId,
            time: 120000,
        });

        collector.on('collect', async (interaction) => {
            const currentPlayer = client.music.players.get(guildId);
            if (!currentPlayer) {
                return interaction.update({ components: [buildContainer(0)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            }

            let newVol = currentPlayer.volume;
            if (interaction.customId === 'vol_plus') newVol = Math.min(100, newVol + 10);
            else if (interaction.customId === 'vol_minus') newVol = Math.max(0, newVol - 10);

            await currentPlayer.setVolume(newVol);
            await interaction.update({ components: [buildContainer(newVol)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        });

        collector.on('end', () => {
            volMsg.edit({ components: [buildContainer(player.volume)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        });
    },
};
