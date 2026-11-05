// src/hybrid/dumpvoicechannels/dumpvoicechannels.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, getMember } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { hasPermission } = require('../../lib/permissions');
const { runDump } = require('../../lib/dumpFlow');
const DumpExporter = require('../../lib/dumpExporter');

module.exports = {
    data: new SlashCommandBuilder().setName('dumpvoicechannels').setDescription('Exporta la lista de canales de voz del servidor (te lo envía por DM)'),

    name: 'dumpvoicechannels',
    aliases: ['dumpvc'],
    category: 'moderación',
    cooldownMs: 10000,

    async execute(ctx) {
        const member = getMember(ctx);
        if (!hasPermission(member, PermissionsBitField.Flags.ManageChannels) && !hasPermission(member, PermissionsBitField.Flags.Administrator)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitás el permiso **Gestionar Canales** o **Administrador**.'), ephemeral: true });
        }

        await runDump(ctx, {
            label: 'canales de voz',
            fileKey: 'voicechannels',
            generate: async () => {
                const content = DumpExporter.formatVoiceChannels(ctx.guild);
                const count = ctx.guild.channels.cache.filter((ch) => ch.type === 2).size;
                return { content, count };
            },
        });
    },
};
