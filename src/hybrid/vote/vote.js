// src/hybrid/vote/vote.js
//
// Votos de top.gg — PRÓXIMAMENTE.
//
// El bot está en revisión en top.gg, así que todavía no hay listing donde
// votar. Este comando no muestra un link roto ni un link adivinado: explica qué
// va a pasar y cuándo.
//
// Por qué NO se arma el link con el CLIENT_ID (que es lo que haría la pregunta
// obvia ("si ya tengo el ID, ¿no armo la URL?"):): hasta que top.gg aprueba el bot,
// esa URL da 404, y un botón que lleva a un 404 es peor que no tener botón.
// La variable TOPGG_URL se sigue leyendo, así que cuando lo aprueben alcanza con
// ponerla en el .env y reiniciar: no hay que tocar código.
//
// El link del bot de música viejo estaba hardcodeado en seis lugares distintos
// con el id de SU listing, lo que hacía que los votos de la gente fueran a parar
// al bot del dueño del código. Acá no hay ningún id de otro bot en el proyecto.

const { SlashCommandBuilder } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const { LIMITS } = require('../../music/lib/access');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('vote')
        .setDescription('Votá en top.gg para mantener los límites gratis'),

    name: 'vote',
    aliases: ['votar', 'votos', 'topgg'],
    category: 'utilidad',
    cooldownMs: 5000,

    async execute(ctx) {
        const url = require('../../config').MUSIC?.VOTES?.URL;

        // ── Link configurado: el botón funciona ─────────────────────────────
        if (url) {
            const { ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
            const { hasVotedRecently, isPremium } = require('../../music/lib/access');
            const userId = getUserId(ctx);
            const [votado, premium] = await Promise.all([hasVotedRecently(userId), isPremium(userId)]);

            return reply(ctx, {
                ...infoPanel('Votá en top.gg', premium
                    ? 'Ya tenés premium, así que no necesitás votar. Pero cada voto ayuda a que el bot aparezca más arriba en las listas.'
                    : 'Tu voto dura **12 horas** y mantiene los límites gratis (playlists, favoritas e historial) durante ese tiempo.', {
                    lines: [
                        voted && !premium ? '**Ya votaste hoy.** Volvé a votar mañana para renovar.' : '',
                        premium ? '' : `Límites con voto: ${LIMITS.premium.playlists} playlists, ${LIMITS.premium.favourites} favoritas.`,
                    ].filter(Boolean),
                    rows: [new ActionRowBuilder().addComponents(
                        new ButtonBuilder().setLabel('Votar en top.gg').setStyle(ButtonStyle.Link).setURL(url).setEmoji('🗳️'),
                    )],
                }),
            });
        }

        // ── Sin link todavía: el bot está en revisión ────────────────────────
        return reply(ctx, infoPanel('Votos en top.gg', null, {
            kicker: 'Próximamente',
            icon: '🗳️',
            description: 'Deyra está **en revisión en top.gg**. Apenas lo aprueben, este comando va a tener el link para votar.',
            lists: [
                {
                    title: 'Qué te da votar',
                    items: [
                        `Votar mantiene **12 horas** los límites gratis: ${LIMITS.premium.playlists} playlists, ${LIMITS.premium.favourites} favoritas y ${LIMITS.premium.history} de historial.`,
                        'Los límites **nunca borran** lo que ya tenés: solo frenan agregar más.',
                        'Sin voto ni premium, la cola, los filtros de audio y el modo 24/7 son igual de tuyos. Lo que se limita es la biblioteca personal.',
                    ],
                },
                {
                    title: 'Mientras tanto',
                    items: [
                        '`/premium` te dice en qué estado estás y cuánto te queda de cada cosa.',
                        '`/filter`, `/playlist`, `/favourite` y `/history` ya funcionan sin límite de votos.',
                    ],
                },
            ],
            footerText: 'Va a aparecer acá solo, sin que nadie tenga que avisarte.',
        }));
    },
};
