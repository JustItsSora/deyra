// src/hybrid/dumpbans/dumpbans.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, getMember } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { hasPermission } = require('../../lib/permissions');
const { runDump } = require('../../lib/dumpFlow');
const DumpExporter = require('../../lib/dumpExporter');

module.exports = {
    data: new SlashCommandBuilder().setName('dumpbans').setDescription('Exporta la lista de usuarios baneados del servidor (te lo envía por DM)'),

    name: 'dumpbans',
    category: 'moderación',
    cooldownMs: 10000,

    async execute(ctx) {
        const member = getMember(ctx);
        if (!hasPermission(member, PermissionsBitField.Flags.BanMembers) && !hasPermission(member, PermissionsBitField.Flags.Administrator)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitás el permiso **Banear Miembros** o **Administrador**.'), ephemeral: true });
        }

        await runDump(ctx, {
            label: 'baneos',
            fileKey: 'bans',
            generate: async () => {
                const bans = await ctx.guild.bans.fetch();
                const content = await DumpExporter.formatBans(ctx.guild);
                return { content, count: bans.size };
            },
        });
    },
};
