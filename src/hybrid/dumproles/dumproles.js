// src/hybrid/dumproles/dumproles.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, getMember } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { hasPermission } = require('../../lib/permissions');
const { runDump } = require('../../lib/dumpFlow');
const DumpExporter = require('../../lib/dumpExporter');

module.exports = {
    data: new SlashCommandBuilder().setName('dumproles').setDescription('Exporta la lista de roles del servidor (te lo envía por DM)'),

    name: 'dumproles',
    category: 'moderación',
    cooldownMs: 10000,

    async execute(ctx) {
        const member = getMember(ctx);
        if (!hasPermission(member, PermissionsBitField.Flags.ManageRoles) && !hasPermission(member, PermissionsBitField.Flags.Administrator)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitás el permiso **Gestionar Roles** o **Administrador**.'), ephemeral: true });
        }

        await runDump(ctx, {
            label: 'roles',
            fileKey: 'roles',
            generate: async () => {
                const content = DumpExporter.formatRoles(ctx.guild);
                return { content, count: ctx.guild.roles.cache.size };
            },
        });
    },
};
