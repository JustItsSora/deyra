// src/hybrid/dumpemotes/dumpemotes.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, getMember } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { hasPermission } = require('../../lib/permissions');
const { runDump } = require('../../lib/dumpFlow');
const DumpExporter = require('../../lib/dumpExporter');

module.exports = {
    data: new SlashCommandBuilder().setName('dumpemotes').setDescription('Exporta la lista de emojis del servidor (te lo envía por DM)'),

    name: 'dumpemotes',
    aliases: ['dumpemojis'],
    category: 'moderación',
    cooldownMs: 10000,

    async execute(ctx) {
        const member = getMember(ctx);
        if (!hasPermission(member, PermissionsBitField.Flags.ManageEmojisAndStickers) && !hasPermission(member, PermissionsBitField.Flags.Administrator)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitás el permiso **Gestionar Emojis y Stickers** o **Administrador**.'), ephemeral: true });
        }

        await runDump(ctx, {
            label: 'emojis',
            fileKey: 'emotes',
            generate: async () => {
                const content = DumpExporter.formatEmojis(ctx.guild);
                return { content, count: ctx.guild.emojis.cache.size };
            },
        });
    },
};
