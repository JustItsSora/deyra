const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emojisteal')
        .setDescription('Copia un emoji personalizado de otro servidor a este')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
        .addStringOption(o => o.setName('emoji').setDescription('El emoji a copiar (pégalo directamente)').setRequired(true))
        .addStringOption(o => o.setName('nombre').setDescription('Nombre para el nuevo emoji (opcional)').setRequired(false)),

    name: 'emojisteal',
    aliases: ['robaremoji'],
    category: 'configuración',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageEmojisAndStickers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Emojis y Stickers**.'), ephemeral: true });
        }

        const raw = isSlash(ctx) ? ctx.options.getString('emoji') : args[0];
        const customName = isSlash(ctx) ? ctx.options.getString('nombre') : args[1];

        const match = raw?.match(/<(a)?:(\w+):(\d+)>/);
        if (!match) {
            return reply(ctx, { ...errorPanel('Emoji inválido', 'Debe ser un emoji personalizado de Discord (no unicode).'), ephemeral: true });
        }

        const [, animated, name, id] = match;
        const url = `https://cdn.discordapp.com/emojis/${id}.${animated ? 'gif' : 'png'}`;
        const finalName = (customName || name).replace(/\s+/g, '_').slice(0, 32);

        try {
            const emoji = await ctx.guild.emojis.create({ attachment: url, name: finalName });
            return reply(ctx, successPanel('Emoji copiado', `Se añadió ${emoji} como \`:${emoji.name}:\`.`));
        } catch (err) {
            console.error('[emojisteal] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude copiar ese emoji. Puede que ya exista uno con ese nombre o que el servidor esté lleno de emojis.'), ephemeral: true });
        }
    },
};
