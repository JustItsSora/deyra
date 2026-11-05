const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('stickersteal')
        .setDescription('Copia al servidor el sticker de tu último mensaje enviado en este canal')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
        .addStringOption(o => o.setName('nombre').setDescription('Nombre para el nuevo sticker (opcional)').setRequired(false)),

    name: 'stickersteal',
    aliases: ['robarsticker'],
    category: 'configuración',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageEmojisAndStickers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Emojis y Stickers**.'), ephemeral: true });
        }

        const messages = await ctx.channel.messages.fetch({ limit: 20 });
        const withSticker = [...messages.values()].find(m => m.stickers.size > 0);

        if (!withSticker) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No encontré ningún sticker en los últimos 20 mensajes de este canal.'), ephemeral: true });
        }

        const sticker = withSticker.stickers.first();
        const customName = args[0] || sticker.name;

        try {
            const created = await ctx.guild.stickers.create({
                file: sticker.url,
                name: customName.slice(0, 30),
                tags: sticker.tags || 'emoji',
                description: sticker.description || undefined,
            });
            return reply(ctx, successPanel('Sticker copiado', `Se añadió el sticker **${created.name}** al servidor.`));
        } catch (err) {
            console.error('[stickersteal] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude copiar ese sticker.'), ephemeral: true });
        }
    },
};
