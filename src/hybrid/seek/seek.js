// src/hybrid/seek/seek.js
const { SlashCommandBuilder } = require('discord.js');
const ms = require('ms');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, warningPanel, infoPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

function formatTime(msVal) {
    const totalSeconds = Math.floor(msVal / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

function parseTimeInput(input) {
    if (/^\d+$/.test(input)) return parseInt(input, 10) * 1000;
    if (/^\d+:\d+$/.test(input)) {
        const [m, s] = input.split(':').map(Number);
        return (m * 60 + s) * 1000;
    }
    if (/^\d+:\d+:\d+$/.test(input)) {
        const [h, m, s] = input.split(':').map(Number);
        return (h * 3600 + m * 60 + s) * 1000;
    }
    try {
        return ms(input);
    } catch (_) {
        return NaN;
    }
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('seek')
        .setDescription('Salta a un momento específico de la canción actual')
        .addStringOption((o) => o.setName('tiempo').setDescription('Ej: 1:30, 40, 1m').setRequired(true)),

    name: 'seek',
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        if (!requireMusic(ctx)) return;
        const player = requirePlayer(ctx);
        if (!player) return;
        if (!requireSameVoiceChannel(ctx, player)) return;

        if (!player.queue.current) {
            return reply(ctx, { ...warningPanel('Nada sonando', 'Poné una canción primero.'), ephemeral: true });
        }

        const timeInput = isSlash(ctx) ? ctx.options.getString('tiempo') : args[0];
        if (!timeInput) {
            return reply(ctx, { ...infoPanel('Falta el tiempo', 'Uso: `/seek tiempo:1:30`\nEjemplo: `!seek 1:30`'), ephemeral: true });
        }

        const time = parseTimeInput(timeInput);
        if (!time || Number.isNaN(time)) {
            return reply(ctx, { ...warningPanel('Formato inválido', 'Formatos válidos: `40`, `1:30`, `10s`, `1m`.'), ephemeral: true });
        }

        const duration = player.queue.current.length;
        const position = player.position;
        const song = player.queue.current;

        if (time > duration) {
            return reply(ctx, { ...warningPanel('Fuera de rango', `La canción dura \`${formatTime(duration)}\`.`), ephemeral: true });
        }

        await player.seek(time);
        const action = time > position ? 'Avancé' : 'Retrocedí';

        return reply(ctx, successPanel(action, `[${song.title.substring(0, 45)}](${song.uri})\nPosición: \`${formatTime(time)} / ${formatTime(duration)}\``));
    },
};
