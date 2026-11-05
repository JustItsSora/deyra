const { SlashCommandBuilder } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverlist')
        .setDescription('[Owner] Lista los servidores donde está el bot'),

    name: 'serverlist',
    aliases: [],
    category: 'owner',

    async execute(ctx) {
        if (!isOwner(getUserId(ctx))) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Este comando es solo para el dueño del bot.'), ephemeral: true });
        }

        const guilds = [...ctx.client.guilds.cache.values()].sort((a, b) => b.memberCount - a.memberCount).slice(0, 25);
        const lines = guilds.map(g => `**${g.name}** — ${g.memberCount} miembros (${g.id})`);

        return reply(ctx, { ...infoPanel(`Servidores (${ctx.client.guilds.cache.size} total)`, undefined, { lines }), ephemeral: true });
    },
};
