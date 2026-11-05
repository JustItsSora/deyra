// src/hybrid/speed/speed.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, successPanel, warningPanel, errorPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('speed')
        .setDescription('Cambia la velocidad de reproducción (0.25x - 3.0x)')
        .addNumberOption((o) => o.setName('velocidad').setDescription('Valor entre 0.25 y 3.0').setMinValue(0.25).setMaxValue(3)),

    name: 'speed',
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

        const currentSpeed = player.data.get('speed') || 1.0;
        const speedInput = isSlash(ctx) ? ctx.options.getNumber('velocidad') : (args[0] ? parseFloat(args[0]) : null);

        if (speedInput === null || speedInput === undefined) {
            return reply(ctx, infoPanel('Control de velocidad', `**Velocidad actual:** \`${currentSpeed}x\`\n**Rango permitido:** \`0.25x - 3.0x\`\n\nUso: \`/speed velocidad:1.5\` o \`!speed 1.5\``));
        }

        if (Number.isNaN(speedInput) || speedInput < 0.25 || speedInput > 3) {
            return reply(ctx, { ...warningPanel('Velocidad inválida', `Usá un valor entre \`0.25\` y \`3.0\`.\nVelocidad actual: \`${currentSpeed}x\`.`), ephemeral: true });
        }

        try {
            const currentPitch = player.data.get('pitch') || 1.0;
            await player.shoukaku.setFilters({ timescale: { speed: speedInput, pitch: currentPitch, rate: 1.0 } });
            player.data.set('speed', speedInput);

            return reply(ctx, successPanel('Velocidad actualizada', `La velocidad de reproducción es ahora \`${speedInput}x\`.`));
        } catch (err) {
            return reply(ctx, { ...errorPanel('Error', `No se pudo cambiar la velocidad: ${err.message}`), ephemeral: true });
        }
    },
};
