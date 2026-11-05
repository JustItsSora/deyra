// src/hybrid/rewind/rewind.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, warningPanel, errorPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

function formatTime(msVal) {
    const totalSeconds = Math.floor(msVal / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${minutes}:${String(secs).padStart(2, '0')}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rewind')
        .setDescription('Retrocede la canción actual N segundos (10 por defecto)')
        .addIntegerOption((o) => o.setName('segundos').setDescription('Cantidad de segundos a retroceder').setMinValue(1)),

    name: 'rewind',
    aliases: ['rw'],
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

        let seconds = isSlash(ctx) ? (ctx.options.getInteger('segundos') || 10) : 10;
        if (!isSlash(ctx) && args.length > 0) {
            seconds = parseInt(args[0], 10);
            if (Number.isNaN(seconds) || seconds <= 0) {
                return reply(ctx, { ...warningPanel('Uso incorrecto', 'Uso: `!rewind <segundos>`\nEjemplo: `!rewind 30`'), ephemeral: true });
            }
        }

        const newPosition = Math.max(0, player.position - (seconds * 1000));

        try {
            await player.seek(newPosition);
            return reply(ctx, successPanel('Retrocedido', `Retrocedí \`${seconds}s\` — ahora en \`${formatTime(newPosition)}\`.`));
        } catch (err) {
            return reply(ctx, { ...errorPanel('Error', `No se pudo retroceder: ${err.message}`), ephemeral: true });
        }
    },
};
