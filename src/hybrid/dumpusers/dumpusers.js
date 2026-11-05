// src/hybrid/dumpusers/dumpusers.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, getMember } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { hasPermission } = require('../../lib/permissions');
const { runDump } = require('../../lib/dumpFlow');
const DumpExporter = require('../../lib/dumpExporter');

module.exports = {
    data: new SlashCommandBuilder().setName('dumpusers').setDescription('Exporta la lista completa de miembros del servidor (te lo envía por DM)'),

    name: 'dumpusers',
    category: 'moderación',
    cooldownMs: 10000,

    async execute(ctx) {
        const member = getMember(ctx);
        if (!hasPermission(member, PermissionsBitField.Flags.Administrator)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitás el permiso **Administrador**.'), ephemeral: true });
        }

        await runDump(ctx, {
            label: 'miembros',
            fileKey: 'users',
            generate: async () => {
                const content = DumpExporter.formatMembers(ctx.guild, false, false);
                return { content, count: ctx.guild.members.cache.size };
            },
        });
    },
};
