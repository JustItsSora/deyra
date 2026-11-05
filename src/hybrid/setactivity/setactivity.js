const { SlashCommandBuilder, ActivityType } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('setactivity')
        .setDescription('[Owner] Cambia la actividad mostrada del bot')
        .addStringOption(o => o.setName('tipo').setDescription('Tipo de actividad').setRequired(true)
            .addChoices({ name: 'Jugando', value: 'Playing' }, { name: 'Viendo', value: 'Watching' }, { name: 'Escuchando', value: 'Listening' }, { name: 'Compitiendo', value: 'Competing' }))
        .addStringOption(o => o.setName('texto').setDescription('Texto de la actividad').setRequired(true)),

    name: 'setactivity',
    aliases: [],
    category: 'owner',

    async execute(ctx, args = []) {
        if (!isOwner(getUserId(ctx))) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Este comando es solo para el dueño del bot.'), ephemeral: true });
        }

        let type, text;
        if (isSlash(ctx)) {
            type = ctx.options.getString('tipo');
            text = ctx.options.getString('texto');
        } else {
            type = args[0];
            text = args.slice(1).join(' ');
        }

        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto de la actividad.'), ephemeral: true });
        }

        ctx.client.user.setActivity(text, { type: ActivityType[type] ?? ActivityType.Playing });
        return reply(ctx, successPanel('Actividad actualizada', `Ahora: **${type} ${text}**.`));
    },
};
