const { SlashCommandBuilder } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');
const { Blacklist } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('blacklistlist')
        .setDescription('[Owner] Lista los usuarios bloqueados'),

    name: 'blacklistlist',
    aliases: [],
    category: 'owner',

    async execute(ctx) {
        if (!isOwner(getUserId(ctx))) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Este comando es solo para el dueño del bot.'), ephemeral: true });
        }

        const entries = await Blacklist.findAll({ limit: 30 });
        if (entries.length === 0) {
            return reply(ctx, infoPanel('Blacklist', 'No hay usuarios bloqueados.'));
        }

        const lines = entries.map(e => `<@${e.userId}> — ${e.reason || 'Sin razón'}`);
        return reply(ctx, infoPanel(`Usuarios bloqueados (${entries.length})`, undefined, { lines }));
    },
};
