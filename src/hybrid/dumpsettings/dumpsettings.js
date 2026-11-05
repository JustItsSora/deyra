// src/hybrid/dumpsettings/dumpsettings.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, getMember } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { hasPermission } = require('../../lib/permissions');
const { runDump } = require('../../lib/dumpFlow');
const DumpExporter = require('../../lib/dumpExporter');

module.exports = {
    data: new SlashCommandBuilder().setName('dumpsettings').setDescription('Exporta la configuración general del servidor (te lo envía por DM)'),

    name: 'dumpsettings',
    aliases: ['dumpconfig'],
    category: 'moderación',
    cooldownMs: 10000,

    async execute(ctx) {
        const member = getMember(ctx);
        if (!hasPermission(member, PermissionsBitField.Flags.Administrator)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitás el permiso **Administrador**.'), ephemeral: true });
        }

        await runDump(ctx, {
            label: 'la configuración del servidor',
            fileKey: 'settings',
            generate: async () => {
                const content = DumpExporter.formatSettings(ctx.guild);
                return { content, count: 1 };
            },
        });
    },
};
