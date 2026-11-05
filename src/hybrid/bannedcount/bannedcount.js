// src/hybrid/bannedcount/bannedcount.js
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const { missingBotPermissions } = require('../../lib/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('bannedcount')
        .setDescription('Muestra cuántos usuarios están baneados'),

    name: 'bannedcount',
    aliases: [],
    category: 'moderación',
    cooldownMs: 3000,

    async execute(ctx) {
        // Ver la lista de baneados exige "Banear miembros". Sin eso, Discord
        // responde 50013 y el comando moría con un stack en la consola.
        const missing = await missingBotPermissions(ctx.guild, null, [PermissionsBitField.Flags.BanMembers]);
        if (missing.length) {
            return reply(ctx, {
                ...errorPanel(
                    'Me falta un permiso',
                    `No puedo ver la lista de baneados porque no tengo el permiso **${missing.join(', ')}** en este servidor.`,
                ),
                ephemeral: true,
            });
        }

        const bans = await ctx.guild.bans.fetch();
        return reply(ctx, infoPanel('Usuarios baneados', `Este servidor tiene **${bans.size}** usuario(s) baneado(s).`));
    },
};
