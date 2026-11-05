// src/hybrid/skipto/skipto.js
const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, warningPanel, errorPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer, requireSameVoiceChannel } = require('../../music/lib/musicChecks');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('skipto')
        .setDescription('Salta directamente a una posición específica de la cola')
        .addIntegerOption((o) => o.setName('posicion').setDescription('Número de posición en la cola').setRequired(true).setMinValue(1)),

    name: 'skipto',
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

        const position = isSlash(ctx) ? ctx.options.getInteger('posicion') : Number(args[0]);
        if (Number.isNaN(position) || position < 1 || position > player.queue.length) {
            return reply(ctx, { ...warningPanel('Posición inválida', `Rango válido: \`1-${player.queue.length}\`.`), ephemeral: true });
        }

        const queueIndex = position - 1;
        const targetSong = player.queue[queueIndex];
        if (!targetSong) {
            return reply(ctx, { ...errorPanel('No encontrada', `No encontré ninguna canción en la posición \`${position}\`.`), ephemeral: true });
        }

        if (queueIndex > 0) {
            player.queue.splice(0, queueIndex);
        }

        await player.skip();

        return reply(ctx, successPanel('Salto realizado', `Saltando a **${targetSong.title}**.`));
    },
};
