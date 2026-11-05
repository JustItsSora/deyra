const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setavatar')
        .setDescription('[Owner] Cambia el avatar del bot')
        .addStringOption(o => o.setName('url').setDescription('URL de la nueva imagen').setRequired(true)),

    name: 'setavatar',
    aliases: [],
    category: 'owner',

    async execute(ctx, args = []) {
        if (!isOwner(getUserId(ctx))) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Este comando es solo para el dueño del bot.'), ephemeral: true });
        }

        const url = isSlash(ctx) ? ctx.options.getString('url') : args[0];
        if (!url) {
            return reply(ctx, { ...errorPanel('Falta la URL', 'Especifica la URL de la nueva imagen.'), ephemeral: true });
        }

        try {
            await ctx.client.user.setAvatar(url);
            return reply(ctx, successPanel('Avatar actualizado', 'El avatar del bot fue actualizado.'));
        } catch (err) {
            console.error('[setavatar] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude cambiar el avatar. Verifica que la URL sea una imagen válida.'), ephemeral: true });
        }
    },
};
