const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('invite')
        .setDescription('Obtén el enlace de invitación de Deyra'),

    name: 'invite',
    aliases: ['invitar'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const client = ctx.client;
        const permissions = PermissionFlagsBits.Administrator;
        const url = `https://discord.com/api/oauth2/authorize?client_id=${client.user.id}&permissions=${permissions}&scope=bot%20applications.commands`;

        return reply(ctx, infoPanel('🔗 Invita a Deyra', `[Haz clic aquí para invitar a Deyra a tu servidor](${url})`));
    },
};
