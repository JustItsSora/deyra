// src/hybrid/dumpbots/dumpbots.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, getMember } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { hasPermission } = require('../../lib/permissions');
const { runDump } = require('../../lib/dumpFlow');
const DumpExporter = require('../../lib/dumpExporter');

module.exports = {
    data: new SlashCommandBuilder().setName('dumpbots').setDescription('Exporta la lista de bots del servidor (te lo envía por DM)'),

    name: 'dumpbots',
    category: 'moderación',
    cooldownMs: 10000,

    async execute(ctx) {
        const member = getMember(ctx);
        if (!hasPermission(member, PermissionsBitField.Flags.Administrator)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitás el permiso **Administrador**.'), ephemeral: true });
        }

        await runDump(ctx, {
            label: 'bots',
            fileKey: 'bots',
            generate: async () => {
                const bots = ctx.guild.members.cache.filter((m) => m.user.bot);
                const content = DumpExporter.formatMembers(ctx.guild, false, true);
                return { content, count: bots.size };
            },
        });
    },
};
