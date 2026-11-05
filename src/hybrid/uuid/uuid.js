const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('uuid')
        .setDescription('Genera un UUID v4 aleatorio'),

    name: 'uuid',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const id = crypto.randomUUID();
        return reply(ctx, infoPanel('UUID generado', `\`${id}\``));
    },
};
