const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');

// Estado en memoria simple; si el proceso se reinicia, el modo mantenimiento se resetea (esperado).
let maintenanceMode = false;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('maintenance')
        .setDescription('[Owner] Activa o desactiva el modo mantenimiento')
        .addBooleanOption(o => o.setName('activo').setDescription('true para activar, false para desactivar').setRequired(true)),

    name: 'maintenance',
    aliases: [],
    category: 'owner',
    isMaintenanceActive: () => maintenanceMode,

    async execute(ctx, args = []) {
        if (!isOwner(getUserId(ctx))) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Este comando es solo para el dueño del bot.'), ephemeral: true });
        }

        const active = isSlash(ctx) ? ctx.options.getBoolean('activo') : args[0] === 'true';
        maintenanceMode = active;

        ctx.client.user.setPresence({
            status: active ? 'dnd' : 'online',
            activities: [{ name: active ? 'En mantenimiento' : '/help', type: 3 }],
        });

        return reply(ctx, successPanel('Modo mantenimiento', `El modo mantenimiento ahora está **${active ? 'activado' : 'desactivado'}**.`));
    },
};
