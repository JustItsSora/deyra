const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rolecount')
        .setDescription('Muestra cuántos roles tiene el servidor'),

    name: 'rolecount',
    aliases: ['contarroles'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const total = ctx.guild.roles.cache.size - 1; // excluye @everyone
        const hoisted = ctx.guild.roles.cache.filter(r => r.hoist).size;
        const mentionable = ctx.guild.roles.cache.filter(r => r.mentionable).size;

        return reply(ctx, infoPanel('Conteo de roles', undefined, {
            lines: [`**Total:** ${total}`, `**Mostrados por separado:** ${hoisted}`, `**Mencionables:** ${mentionable}`],
        }));
    },
};
