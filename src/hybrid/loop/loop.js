// src/hybrid/loop/loop.js
const {
    SlashCommandBuilder, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags,
} = require('discord.js');
const { reply, isSlash, getUserId, replyAndGetMessage } = require('../../lib/reply');
const { warningPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');
const config = require('../../config');

function modeLabel(mode) {
    return mode === 'none' ? 'Desactivado' : mode === 'track' ? 'Repetir canción' : 'Repetir cola';
}

function finalContainer(mode) {
    return new ContainerBuilder().setAccentColor(config.COLORS.SUCCESS)
        .addTextDisplayComponents(new TextDisplayBuilder().setContent('### ✅ Modo de repetición actualizado'))
        .addSeparatorComponents(new SeparatorBuilder())
        .addTextDisplayComponents(new TextDisplayBuilder().setContent(`El modo ahora es **${modeLabel(mode)}**.`));
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('loop')
        .setDescription('Configura el modo de repetición: canción, cola o desactivado')
        .addStringOption((o) => o.setName('modo').setDescription('Modo de repetición').addChoices(
            { name: 'Canción', value: 'track' },
            { name: 'Cola', value: 'queue' },
            { name: 'Desactivado', value: 'none' },
        )),

    name: 'loop',
    aliases: ['repeat'],
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;
        if (!requireSameVoiceChannel(ctx, player)) return;

        if (!player.queue.current) {
            return reply(ctx, { ...warningPanel('Nada sonando', 'Poné una canción primero.'), ephemeral: true });
        }

        const arg = (isSlash(ctx) ? ctx.options.getString('modo') : args[0])?.toLowerCase();
        if (arg === 'off' || arg === 'disable' || arg === 'none') {
            player.setLoop('none');
            return reply(ctx, { components: [finalContainer('none')], flags: MessageFlags.IsComponentsV2 });
        }
        if (arg === 'track' || arg === 'song' || arg === 'cancion') {
            player.setLoop('track');
            return reply(ctx, { components: [finalContainer('track')], flags: MessageFlags.IsComponentsV2 });
        }
        if (arg === 'queue' || arg === 'cola') {
            player.setLoop('queue');
            return reply(ctx, { components: [finalContainer('queue')], flags: MessageFlags.IsComponentsV2 });
        }

        const currentLoop = player.loop || 'none';
        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('### 🔁 Repetición'))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(`**Modo actual:** \`${modeLabel(currentLoop)}\``))
            .addSeparatorComponents(new SeparatorBuilder())
            .addActionRowComponents(
                new ActionRowBuilder().addComponents(
                    new ButtonBuilder().setCustomId('loop_track').setLabel('Canción').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('loop_queue').setLabel('Cola').setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder().setCustomId('loop_off').setLabel('Desactivar').setStyle(ButtonStyle.Danger),
                ),
            );

        const payload = { components: [container], flags: MessageFlags.IsComponentsV2 };
        const msg = await replyAndGetMessage(ctx, payload);
        if (!msg) return;

        const userId = getUserId(ctx);
        const authorName = isSlash(ctx) ? ctx.user.username : ctx.author.username;
        const collector = msg.createMessageComponentCollector({
            filter: (i) => {
                if (i.user.id === userId) return true;
                i.reply({ content: `⚠️ Solo ${authorName} puede usar estos botones.`, flags: MessageFlags.Ephemeral }).catch(() => {});
                return false;
            },
            time: 60000,
        });

        collector.on('collect', async (interaction) => {
            const mode = interaction.customId.replace('loop_', '').replace('off', 'none');
            player.setLoop(mode);
            await interaction.update({ components: [finalContainer(mode)], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
            collector.stop();
        });

        collector.on('end', (collected) => {
            if (collected.size === 0) msg.edit({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});
        });
    },
};
