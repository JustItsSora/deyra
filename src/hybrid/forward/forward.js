// src/hybrid/forward/forward.js
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
        .setName('forward')
        .setDescription('Avanza la canción actual N segundos (10 por defecto)')
        .addIntegerOption((o) => o.setName('segundos').setDescription('Cantidad de segundos a avanzar').setMinValue(1)),

    name: 'forward',
    aliases: ['ff'],
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
                return reply(ctx, { ...warningPanel('Uso incorrecto', 'Uso: `!forward <segundos>`\nEjemplo: `!forward 30`'), ephemeral: true });
            }
        }

        const duration = player.queue.current.length;
        const newPosition = player.position + (seconds * 1000);

        if (newPosition >= duration) {
            await reply(ctx, successPanel('Fin de la canción', 'No se puede avanzar más allá del final. Saltando a la siguiente...'));
            return player.skip();
        }

        try {
            await player.seek(newPosition);
            return reply(ctx, successPanel('Avanzado', `Avancé \`${seconds}s\` — ahora en \`${formatTime(newPosition)}\`.`));
        } catch (err) {
            return reply(ctx, { ...errorPanel('Error', `No se pudo avanzar: ${err.message}`), ephemeral: true });
        }
    },
};
