// src/hybrid/favourite/favourite.js
//
// Guardar la canción que está sonando. Toggle: si ya está guardada, la saca.
//
// Puerto de /favourite del bot de música viejo, con el mismo comportamiento de
// toggle pero con la diferencia de que antes los favoritos eran un JSONB dentro
// de una fila y ahora son filas en music_favorites (ver
// src/music/lib/favouritesService.js para el porqué).
//
// Por defecto sin argumentos actsúa sobre lo que está sonando, que es el 90% de
// los casos. Con `quitar` se saca una canción concreta por nombre (de los
// favoritos) y con `reproducir` se pone una de tus guardadas en la cola.

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getMember, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel, warningPanel } = require('../../lib/panel');
const { requireMusic, requireVoiceChannel, requirePlayer } = require('../../music/lib/musicChecks');
const fav = require('../../music/lib/favouritesService');
const { limitsFor, limitMessage, isPremium } = require('../../music/lib/access');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('favourite')
        .setDescription('Guarda la canción que está sonando en tus favoritas')
        .addSubcommand(s => s.setName('quitar')
            .setDescription('Saca una canción de tus favoritas por nombre')
            .addStringOption(o => o.setName('cancion').setDescription('Nombre de la canción').setRequired(true).setAutocomplete(true)))
        .addSubcommand(s => s.setName('reproducir')
            .setDescription('Agrega a la cola una de tus favoritas')
            .addStringOption(o => o.setName('cancion').setDescription('Canción guardada').setRequired(true).setAutocomplete(true))),

    name: 'favourite',
    aliases: ['fav', 'favorite', 'guardar', 'like'],
    category: 'música',
    cooldownMs: 3000,

    async autocomplete(interaction) {
        const userId = interaction.user.id;
        const term = interaction.options.getFocused();
        const rows = await fav.searchFavorites(userId, term);
        await interaction.respond(
            rows.slice(0, 25).map((r) => ({ name: `${r.title} — ${r.author || '?'}`.slice(0, 100), value: String(r.identifier) })),
        ).catch(() => {});
    },

    async execute(ctx, args = []) {
        if (!requireMusic(ctx)) return;

        const userId = getUserId(ctx);
        const sub = isSlash(ctx) ? ctx.options.getSubcommand() : (args[0]?.toLowerCase() || '');

        // ── quitar <canción> ────────────────────────────────────────────────
        if (sub === 'quitar' || sub === 'remove' || sub === 'rm') {
            const term = isSlash(ctx) ? ctx.options.getString('cancion') : args.slice(1).join(' ');
            const rows = await fav.searchFavorites(userId, term);
            const exacto = rows.find((r) => r.identifier === term || r.title.toLowerCase() === term.toLowerCase());
            if (!exacto) {
                return reply(ctx, {
                    ...errorPanel('No la tengo guardada', `No encontré \`${term}\` entre tus favoritas. Usá \`/favourites\` para ver la lista.`),
                    ephemeral: true,
                });
            }
            await fav.removeFavorite(userId, exacto.identifier);
            return reply(ctx, successPanel('Quitada de favoritas', `**${exacto.title}** ya no está en tu lista.`));
        }

        // ── reproducir <canción> ────────────────────────────────────────────
        if (sub === 'reproducir' || sub === 'play') {
            if (!requireVoiceChannel(ctx)) return;
            const identifier = isSlash(ctx) ? ctx.options.getString('cancion') : args.slice(1).join(' ');
            const rows = await fav.searchFavorites(userId, identifier);
            const favourite = rows.find((r) => r.identifier === identifier) || rows[0];
            if (!favourite) {
                return reply(ctx, {
                    ...errorPanel('No la tengo guardada', `No encontré \`${identifier}\` entre tus favoritas.`),
                    ephemeral: true,
                });
            }

            const { requireOrCreatePlayer } = require('../../music/lib/musicChecks');
            const member = getMember(ctx);
            const player = await requireOrCreatePlayer(ctx, member.voice.channel);
            if (!player) return;

            const res = await player.search(favourite.uri || favourite.identifier, { requester: ctx.user || ctx.author })
                .catch(() => null);
            if (!res?.tracks?.length) {
                return reply(ctx, {
                    ...errorPanel('No la pude encontrar', `La canción **${favourite.title}** ya no está disponible (se habrá caído el link o el video).`),
                    ephemeral: true,
                });
            }

            player.queue.add(res.tracks[0]);
            if (!player.playing && !player.paused) await player.play();

            return reply(ctx, successPanel('De tus favoritas', `Agregué **${favourite.title}** a la cola.`));
        }

        // ── toggle sobre lo que está sonando ────────────────────────────────
        const player = requirePlayer(ctx);
        if (!player) return;

        const track = player.queue?.current;
        if (!track) {
            return reply(ctx, {
                ...warningPanel('No hay nada sonando', 'Ponate una canción con `/play` y después guardala.'),
                ephemeral: true,
            });
        }

        const premium = await isPremium(userId);
        if (!premium) {
            const total = await fav.countFavorites(userId);
            const aviso = limitMessage('favourites', total, premium);
            if (aviso) {
                return reply(ctx, { ...warningPanel('Límite de favoritas', aviso), ephemeral: true });
            }
        }

        const { saved, title } = await fav.toggleFavorite(track, userId);

        if (saved) {
            const total = await fav.countFavorites(userId);
            return reply(ctx, successPanel('Guardada en favoritas', `**${title}**. Tenés ${total}guardada${total === 1 ? '' : 's'}.`));
        }

        return reply(ctx, successPanel('Quitada de favoritas', `**${title}** ya no está en tu lista.`));
    },
};
