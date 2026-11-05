const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { Reminder } = require('../../data/models');
const { parseDuration, formatDuration } = require('../../lib/duration');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remind')
        .setDescription('Programa un recordatorio')
        .addStringOption(o => o.setName('duracion').setDescription('Ej: 10m, 1h, 2d').setRequired(true))
        .addStringOption(o => o.setName('mensaje').setDescription('Qué quieres que te recuerde').setRequired(true)),

    name: 'remind',
    aliases: ['recordatorio'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let durationRaw, message;
        if (isSlash(ctx)) {
            durationRaw = ctx.options.getString('duracion');
            message = ctx.options.getString('mensaje');
        } else {
            durationRaw = args[0];
            message = args.slice(1).join(' ');
        }

        const durationMs = parseDuration(durationRaw);
        if (!durationMs) {
            return reply(ctx, { ...errorPanel('Duración inválida', 'Usa un formato como `10m`, `1h`, `2d`.'), ephemeral: true });
        }
        if (!message) {
            return reply(ctx, { ...errorPanel('Falta el mensaje', 'Especifica qué quieres que te recuerde.'), ephemeral: true });
        }

        const remindAt = new Date(Date.now() + durationMs);
        await Reminder.create({
            userId: getUserId(ctx),
            channelId: ctx.channel.id,
            guildId: ctx.guild?.id || null,
            content: message,
            remindAt,
        });

        return reply(ctx, successPanel('Recordatorio programado', `Te recordaré en **${formatDuration(durationMs)}**: "${message}"`));
    },
};
