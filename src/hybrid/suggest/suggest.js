const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { buildPanel, errorPanel, successPanel } = require('../../lib/panel');
const { Suggestion, GuildConfig } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('suggest')
        .setDescription('Envía una sugerencia al servidor')
        .addStringOption(o => o.setName('sugerencia').setDescription('Tu sugerencia').setRequired(true)),

    name: 'suggest',
    aliases: ['sugerir'],
    category: 'utilidad',
    cooldownMs: 5000,

    async execute(ctx, args = []) {
        const content = isSlash(ctx) ? ctx.options.getString('sugerencia') : args.join(' ');
        if (!content) {
            return reply(ctx, { ...errorPanel('Falta el contenido', 'Escribe tu sugerencia.'), ephemeral: true });
        }

        const guildConfig = await GuildConfig.findOne({ where: { guildId: ctx.guild.id } });
        const targetChannel = guildConfig?.suggestionsChannelId
            ? await ctx.guild.channels.fetch(guildConfig.suggestionsChannelId).catch(() => null)
            : ctx.channel;

        if (!targetChannel) {
            return reply(ctx, { ...errorPanel('Canal no disponible', 'El canal de sugerencias configurado ya no existe.'), ephemeral: true });
        }

        const authorId = getUserId(ctx);
        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('suggest_up').setLabel('0').setStyle(ButtonStyle.Success).setEmoji('👍'),
            new ButtonBuilder().setCustomId('suggest_down').setLabel('0').setStyle(ButtonStyle.Danger).setEmoji('👎'),
        );

        const panel = buildPanel({ title: '💡 Nueva sugerencia', description: `${content}\n\n-# Sugerido por <@${authorId}>`, tone: 'primary', rows: [row] });

        const sent = await targetChannel.send({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        if (!sent) {
            return reply(ctx, { ...errorPanel('Error', 'No pude enviar la sugerencia a ese canal.'), ephemeral: true });
        }

        await Suggestion.create({ guildId: ctx.guild.id, messageId: sent.id, authorId, content });

        return reply(ctx, { ...successPanel('Sugerencia enviada', `Tu sugerencia fue publicada en ${targetChannel}.`), ephemeral: true });
    },
};
