const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('deletewebhook')
        .setDescription('Elimina un webhook por su ID')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageWebhooks)
        .addStringOption(o => o.setName('id').setDescription('ID del webhook').setRequired(true)),

    name: 'deletewebhook',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageWebhooks)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Webhooks**.'), ephemeral: true });
        }

        const id = isSlash(ctx) ? ctx.options.getString('id') : args[0];
        if (!id) {
            return reply(ctx, { ...errorPanel('Falta el ID', 'Especifica el ID del webhook.'), ephemeral: true });
        }

        try {
            const webhooks = await ctx.channel.fetchWebhooks();
            const webhook = webhooks.get(id);
            if (!webhook) {
                return reply(ctx, { ...errorPanel('No encontrado', 'No existe un webhook con ese ID en este canal.'), ephemeral: true });
            }
            await webhook.delete();
            return reply(ctx, successPanel('Webhook eliminado', 'El webhook fue eliminado.'));
        } catch (err) {
            console.error('[deletewebhook] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude eliminar ese webhook.'), ephemeral: true });
        }
    },
};
