// src/hybrid/dumpmessages/dumpmessages.js
const { SlashCommandBuilder, PermissionsBitField, ChannelType } = require('discord.js');
const { reply, isSlash, getMember } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { hasPermission } = require('../../lib/permissions');
const { runDump } = require('../../lib/dumpFlow');
const DumpExporter = require('../../lib/dumpExporter');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dumpmessages')
        .setDescription('Exporta los mensajes recientes de un canal (te lo envía por DM)')
        .addChannelOption((o) => o.setName('canal').setDescription('Canal a exportar (por defecto, el actual)').addChannelTypes(ChannelType.GuildText))
        .addIntegerOption((o) => o.setName('cantidad').setDescription('Cantidad de mensajes (máximo 500, por defecto 100)').setMinValue(1).setMaxValue(500)),

    name: 'dumpmessages',
    category: 'moderación',
    cooldownMs: 10000,

    async execute(ctx, args = []) {
        const member = getMember(ctx);
        if (!hasPermission(member, PermissionsBitField.Flags.ViewChannel) || !hasPermission(member, PermissionsBitField.Flags.ReadMessageHistory)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitás los permisos **Ver Canal** y **Leer Historial de Mensajes**.'), ephemeral: true });
        }

        let targetChannel;
        let limit;

        if (isSlash(ctx)) {
            targetChannel = ctx.options.getChannel('canal') || ctx.channel;
            limit = ctx.options.getInteger('cantidad') || 100;
        } else {
            targetChannel = ctx.mentions.channels.first() || ctx.channel;
            limit = parseInt(args[1], 10) || parseInt(args[0], 10) || 100;
        }

        limit = Math.min(Math.max(limit, 1), 500);

        if (!targetChannel.isTextBased() || targetChannel.type !== ChannelType.GuildText) {
            return reply(ctx, { ...errorPanel('Canal inválido', 'Elegí un canal de texto válido.'), ephemeral: true });
        }

        await runDump(ctx, {
            label: `mensajes de #${targetChannel.name}`,
            fileKey: 'messages',
            generate: async () => {
                const content = await DumpExporter.formatMessages(targetChannel, limit);
                return { content, count: limit };
            },
        });
    },
};
