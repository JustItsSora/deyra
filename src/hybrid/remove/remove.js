// src/hybrid/remove/remove.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, warningPanel, infoPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

function formatDuration(ms) {
    if (!ms || ms <= 0) return 'En vivo';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('remove')
        .setDescription('Quita una canción de la cola por su posición')
        .addIntegerOption((o) => o.setName('posicion').setDescription('Posición en la cola a quitar').setMinValue(1)),

    name: 'remove',
    aliases: ['rm'],
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
        if (player.queue.length === 0) {
            return reply(ctx, { ...infoPanel('Cola vacía', 'La cola está vacía.'), ephemeral: true });
        }

        const positionInput = isSlash(ctx) ? ctx.options.getInteger('posicion') : (args[0] ? Number(args[0]) : null);

        if (!positionInput) {
            const list = player.queue.slice(0, 10).map((t, i) => `**\`${i + 1}\`** | ${t.title} — \`${formatDuration(t.length)}\``).join('\n');
            return reply(ctx, infoPanel('Quitar una canción', `${list}\n\n-# Uso: \`/remove posicion:2\` o \`!remove 2\``));
        }

        const position = positionInput - 1;
        if (Number.isNaN(position) || position < 0 || position >= player.queue.length) {
            return reply(ctx, { ...warningPanel('Posición inválida', `La cola tiene \`${player.queue.length}\` canción(es).`), ephemeral: true });
        }

        const track = player.queue[position];
        player.queue.splice(position, 1);

        return reply(ctx, successPanel('Canción quitada', `[${track.title}](${track.uri})`));
    },
};
