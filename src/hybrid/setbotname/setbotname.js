const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setbotname')
        .setDescription('[Owner] Cambia el nombre de usuario del bot')
        .addStringOption(o => o.setName('nombre').setDescription('Nuevo nombre').setRequired(true)),

    name: 'setbotname',
    aliases: [],
    category: 'owner',

    async execute(ctx, args = []) {
        if (!isOwner(getUserId(ctx))) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Este comando es solo para el dueño del bot.'), ephemeral: true });
        }

        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args.join(' ');
        if (!name) {
            return reply(ctx, { ...errorPanel('Falta el nombre', 'Especifica el nuevo nombre.'), ephemeral: true });
        }

        try {
            await ctx.client.user.setUsername(name);
            return reply(ctx, successPanel('Nombre actualizado', `El bot ahora se llama **${name}**.`));
        } catch (err) {
            console.error('[setbotname] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude cambiar el nombre (Discord limita cuántas veces por día se puede cambiar).'), ephemeral: true });
        }
    },
};
