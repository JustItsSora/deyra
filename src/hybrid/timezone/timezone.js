const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timezone')
        .setDescription('Muestra la hora actual en una zona horaria específica')
        .addStringOption(o => o.setName('zona').setDescription('Ej: America/New_York, Europe/Madrid, Asia/Tokyo').setRequired(true)),

    name: 'timezone',
    aliases: ['tz'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const zone = isSlash(ctx) ? ctx.options.getString('zona') : args[0];
        if (!zone) {
            return reply(ctx, { ...errorPanel('Falta la zona', 'Especifica una zona horaria válida, ej: `Europe/Madrid`.'), ephemeral: true });
        }

        try {
            const formatter = new Intl.DateTimeFormat('es-ES', { timeZone: zone, dateStyle: 'full', timeStyle: 'long' });
            const formatted = formatter.format(new Date());
            return reply(ctx, infoPanel(`🕐 Hora en ${zone}`, formatted));
        } catch {
            return reply(ctx, { ...errorPanel('Zona inválida', 'Usa un formato IANA válido, ej: `America/New_York`, `Europe/Madrid`.'), ephemeral: true });
        }
    },
};
