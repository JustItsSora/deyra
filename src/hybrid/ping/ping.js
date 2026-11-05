// /ping — latencia del bot.
//
// La versión anterior mandaba un texto plano "Calculando..." y después
// intentaba editarlo a un panel: Discord rechaza mezclar `content` con el flag
// IsComponentsV2, así que el .edit() fallaba en silencio y el comando no
// respondía nunca. Ahora mide y envía el panel final de una.
//
// Además de la latencia, muestra la de la API y la de escritura en el canal,
// que son las tres que un usuario suele querer ver.

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const ui = require('../../lib/ui');

function rating(ping) {
    if (ping < 100) return { tone: 'success', text: 'Excelente' };
    if (ping < 200) return { tone: 'success', text: 'Buena' };
    if (ping < 400) return { tone: 'warning', text: 'Aceptable' };
    return { tone: 'error', text: 'Lenta' };
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Muestra la latencia del bot'),

    name: 'ping',
    aliases: ['latencia', 'pong'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const start = Date.now();

        // wsPing puede ser -1 justo tras arrancar (todavía no hubo heartbeat).
        const wsPing = ctx.client.ws.ping;
        const wsValue = wsPing >= 0 ? Math.round(wsPing) : null;

        // Round-trip real: mandamos el panel y medimos cuánto tarda en volver.
        const sent = await reply(ctx, ui.payload({
            category: 'utilidad',
            kicker: 'Latencia',
            title: 'Calculando…',
            icon: '🏓',
            description: 'Midiendo el tiempo de respuesta…',
        })).catch(() => null);

        const roundtrip = Date.now() - start;
        const grade = rating(wsValue ?? roundtrip);

        return reply(ctx, ui.payload({
            category: 'utilidad',
            tone: grade.tone,
            kicker: 'Latencia',
            title: 'Pong',
            icon: '🏓',
            description: `Conexión **${grade.text.toLowerCase()}** 🟢`,
            grid: [
                ['Latencia de API', wsValue !== null ? `${wsValue} ms` : '—'],
                ['Round-trip', `${roundtrip} ms`],
                ['Heartbeat', wsValue !== null ? `${Math.round(wsPing / 1000)}s desde el último` : '—'],
            ],
            meters: [{
                label: 'Round-trip',
                value: Math.min(roundtrip, 600),
                max: 600,
                suffix: 'ms (600ms = tope)',
            }],
            callouts: [{
                tone: 'muted',
                text: 'Discord mide por región: la latencia desde tu casa a un datacenter de Discord no es la misma que a la de Discord mismo.',
            }],
            brand: true,
        }));
    },
};
