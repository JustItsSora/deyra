// src/hybrid/dumpcategories/dumpcategories.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, getMember } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { hasPermission } = require('../../lib/permissions');
const { runDump } = require('../../lib/dumpFlow');
const DumpExporter = require('../../lib/dumpExporter');

module.exports = {
    data: new SlashCommandBuilder().setName('dumpcategories').setDescription('Exporta la lista de categorías del servidor (te lo envía por DM)'),

    name: 'dumpcategories',
    category: 'moderación',
    cooldownMs: 10000,

    async execute(ctx) {
        const member = getMember(ctx);
        if (!hasPermission(member, PermissionsBitField.Flags.ManageChannels) && !hasPermission(member, PermissionsBitField.Flags.Administrator)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitás el permiso **Gestionar Canales** o **Administrador**.'), ephemeral: true });
        }

        await runDump(ctx, {
            label: 'categorías',
            fileKey: 'categories',
            generate: async () => {
                const content = DumpExporter.formatCategories(ctx.guild);
                const count = ctx.guild.channels.cache.filter((ch) => ch.type === 4).size;
                return { content, count };
            },
        });
    },
};
