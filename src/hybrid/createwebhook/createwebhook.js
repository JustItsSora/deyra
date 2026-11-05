const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('createwebhook')
        .setDescription('Crea un webhook en este canal')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageWebhooks)
        .addStringOption(o => o.setName('nombre').setDescription('Nombre del webhook').setRequired(true)),

    name: 'createwebhook',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.ManageWebhooks)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Webhooks**.'), ephemeral: true });
        }

        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args.join(' ');
        if (!name) {
            return reply(ctx, { ...errorPanel('Falta el nombre', 'Especifica un nombre para el webhook.'), ephemeral: true });
        }

        try {
            const webhook = await ctx.channel.createWebhook({ name });
            return reply(ctx, { ...successPanel('Webhook creado', `**Nombre:** ${webhook.name}\n**URL:** ||${webhook.url}||`), ephemeral: true });
        } catch (err) {
            console.error('[createwebhook] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude crear el webhook.'), ephemeral: true });
        }
    },
};
