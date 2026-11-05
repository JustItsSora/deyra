// src/hybrid/nowplaying/nowplaying.js
//
// Qué está sonando ahora, con los mismos botones del panel del canal.
//
// Antes este comando tenía su propia versión del panel: sin botones, con un
// layout distinto y con una barra de progreso ROTA (el ternario de las dos
// ramas daba el mismo resultado, así que la barra nunca se llenaba y solo se
// movía un puntito). Ahora usa src/music/ui/playerPanel.js, el mismo que
// arma el evento playerStart y el musicHandler, así que los tres lugares se
// ven iguales y el arreglo de la barra se hizo una sola vez.

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { reply } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { requireMusic, requirePlayer } = require('../../music/lib/musicChecks');
const { buildPlayerPanel } = require('../../music/ui/playerPanel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nowplaying')
        .setDescription('Muestra la canción que está sonando ahora con sus controles'),

    name: 'nowplaying',
    aliases: ['np', 'sonando'],
    category: 'música',
    cooldownMs: 2000,

    async execute(ctx) {
        if (!requireMusic(ctx)) return;

        const player = requirePlayer(ctx);
        if (!player) return;

        const track = player.queue?.current;
        if (!track) {
            return reply(ctx, {
                ...errorPanel('No hay nada sonando', 'La cola está vacía. Usá `/play` para agregar una canción.'),
                ephemeral: true,
            });
        }

        // El panel se manda al canal (no efímero) a propósito: los botones son
        // persistentes, así que el mensaje sirve de control remoto para toda la
        // cola, no como un dato que se desvanece a los 15 segundos.
        return reply(ctx, {
            components: [buildPlayerPanel(player)],
            flags: MessageFlags.IsComponentsV2,
        });
    },
};
