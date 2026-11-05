// src/hybrid/premium/premium.js
//
// Estado de premium y de votos del usuario, y cuánto le queda de cada cosa.
//
// Es el sustituto de /premium del bot de música viejo, que hacía 5 cosas en un
// comando gigante (estado, lista de servidores, activar, desactivar y un botón
// de compra que apuntaba al Discord del dueño). Acá:
//   · el estado se muestra claro y sin llamada a una API de terceros;
//   · no hay botón de compra, porque Deyra no tiene sistema de pagos todavía.
//     Cuando lo tenga, el botón va acá.
//
// La diferencia de fondo con el bot viejo: los límites se aplican igual para
// todos (ver src/music/lib/access.js), así que el premium sube números en vez de
// abrir funciones ocultas. Eso se explica en el panel: si no, el usuario ve un
// premium y no entiende qué cambia.

const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const config = require('../../config');
const {
    LIMITS, TIERS, getUserPremium, getServerPremium, hasVotedRecently, isBotOwner, limitsFor,
} = require('../../music/lib/access');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premium')
        .setDescription('Muestra tu estado de premium, votos y límites')
        .addBooleanOption(o => o.setName('servidor').setDescription('Ver el estado del servidor en vez del tuyo')),

    name: 'premium',
    aliases: ['premio', 'premiumstatus'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const delServer = ['server', 'servidor'].includes((args[0] || '').toLowerCase());
        const userId = ctx.user?.id || ctx.author?.id;

        if (delServer) {
            const server = await getServerPremium(ctx.guild.id);
            return reply(ctx, infoPanel(
                'Premium de este servidor',
                server
                    ? `**Activo.** Lo activó <@${server.activatedBy}>${server.expiresAt ? ` y vence el ${new Date(server.expiresAt).toLocaleDateString('es-AR')}.` : '.'}`
                    : 'Este servidor **no tiene** premium.',
                {
                    lines: [
                        'Con premium de servidor, `/musicconfig 247`, `/musicconfig volumen` y `/musicconfig autoplay` tienen límites más altos.',
                        'El comando es `/premium servidor` o, con prefijo, `!premium servidor`.',
                    ],
                },
            ));
        }

        const premium = await getUserPremium(userId);
        const voto = await hasVotedRecently(userId);
        const owner = isBotOwner(userId);
        const limites = await limitsFor(userId);

        const filas = [
            ['Premium', premium ? `**${TIERS[premium.tier]?.label || premium.tier}**` : 'No'],
            ['Vence', premium?.expiresAt ? new Date(premium.expiresAt).toLocaleDateString('es-AR') : '—'],
            ['Voto en top.gg', voto ? '**Votaste hoy**' : 'No votaste en las últimas 12 h'],
            ['Límite de playlists', `${limites.playlists}`],
            ['Canciones por playlist', `${limites.playlistSongs}`],
            ['Favoritas', `${limites.favourites}`],
            ['Historial', `${limites.history}`],
        ];

        const bot = config.MUSIC?.VOTES?.URL;
        const como = [];

        if (owner) {
            como.push('Sos el owner del bot: todos los límites están abiertos, sin importar nada más.');
        } else if (premium) {
            como.push('Con tu premium no llegás a ningún límite. No hace falta que votes.');
        } else if (voto) {
            como.push('Tu voto de hoy mantiene los límites aunque el premium se venza.');
        } else if (bot) {
            como.push(`Votando en [top.gg](${bot}) mantenés los límites gratis por 12 horas.`);
        }

        return reply(ctx, infoPanel('Tu premium', null, {
            grid: filas,
            ...(como.length ? { lists: [{ title: 'Qué podés hacer', items: como }] } : {}),
            footerText: 'Los límites gratis nunca borran lo que ya tenés: solo frenan agregar más.',
        }));
    },
};
