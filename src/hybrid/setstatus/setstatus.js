const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setstatus')
        .setDescription('[Owner] Cambia el estado de presencia del bot')
        .addStringOption(o => o.setName('estado').setDescription('Estado').setRequired(true)
            .addChoices({ name: 'En línea', value: 'online' }, { name: 'Ausente', value: 'idle' }, { name: 'No molestar', value: 'dnd' }, { name: 'Invisible', value: 'invisible' })),

    name: 'setstatus',
    aliases: [],
    category: 'owner',

    async execute(ctx, args = []) {
        if (!isOwner(getUserId(ctx))) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Este comando es solo para el dueño del bot.'), ephemeral: true });
        }

        const status = isSlash(ctx) ? ctx.options.getString('estado') : args[0];
        if (!['online', 'idle', 'dnd', 'invisible'].includes(status)) {
            return reply(ctx, { ...errorPanel('Estado inválido', 'Usa: online, idle, dnd, invisible.'), ephemeral: true });
        }

        ctx.client.user.setStatus(status);
        return reply(ctx, successPanel('Estado actualizado', `El estado ahora es: **${status}**.`));
    },
};
