const { SlashCommandBuilder } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const { Reminder } = require('../../data/models');
const { Op } = require('sequelize');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reminderlist')
        .setDescription('Muestra tus recordatorios pendientes'),

    name: 'reminderlist',
    aliases: ['recordatorios'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const userId = getUserId(ctx);
        const reminders = await Reminder.findAll({
            where: { userId, sent: false, remindAt: { [Op.gte]: new Date() } },
            order: [['remindAt', 'ASC']],
            limit: 15,
        });

        if (reminders.length === 0) {
            return reply(ctx, infoPanel('Recordatorios', 'No tienes recordatorios pendientes.'));
        }

        const lines = reminders.map(r => `**#${r.id}** — ${r.content} — <t:${Math.floor(r.remindAt.getTime() / 1000)}:R>`);
        return reply(ctx, infoPanel('⏰ Tus recordatorios pendientes', undefined, { lines }));
    },
};
