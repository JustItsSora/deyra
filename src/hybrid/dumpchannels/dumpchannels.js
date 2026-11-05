// src/hybrid/dumpchannels/dumpchannels.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, getMember } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { hasPermission } = require('../../lib/permissions');
const { runDump } = require('../../lib/dumpFlow');
const DumpExporter = require('../../lib/dumpExporter');

module.exports = {
    data: new SlashCommandBuilder().setName('dumpchannels').setDescription('Exporta la lista de canales de texto del servidor (te lo envía por DM)'),

    name: 'dumpchannels',
    category: 'moderación',
    cooldownMs: 10000,

    async execute(ctx) {
        const member = getMember(ctx);
        if (!hasPermission(member, PermissionsBitField.Flags.ManageChannels) && !hasPermission(member, PermissionsBitField.Flags.Administrator)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitás el permiso **Gestionar Canales** o **Administrador**.'), ephemeral: true });
        }

        await runDump(ctx, {
            label: 'canales de texto',
            fileKey: 'channels',
            generate: async () => {
                const content = DumpExporter.formatChannels(ctx.guild);
                const count = ctx.guild.channels.cache.filter((ch) => ch.type === 0).size;
                return { content, count };
            },
        });
    },
};
