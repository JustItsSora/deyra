const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { Reminder } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reminderdelete')
        .setDescription('Elimina un recordatorio pendiente')
        .addIntegerOption(o => o.setName('id').setDescription('ID del recordatorio (usa /reminderlist para verlos)').setRequired(true)),

    name: 'reminderdelete',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        const id = isSlash(ctx) ? ctx.options.getInteger('id') : parseInt(args[0], 10);

        const reminder = await Reminder.findOne({ where: { id, userId } });
        if (!reminder) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No tienes un recordatorio con ese ID.'), ephemeral: true });
        }

        await reminder.destroy();
        return reply(ctx, successPanel('Recordatorio eliminado', 'Se eliminó el recordatorio.'));
    },
};
