// src/hybrid/playlist/subcommands/reproducir.js
const { reply, isSlash, getMember, getUserId } = require('../../../lib/reply');
const { successPanel, errorPanel, warningPanel } = require('../../../lib/panel');
const { requireMusic, requireVoiceChannel, requireOrCreatePlayer } = require('../../../music/lib/musicChecks');
const service = require('../../../music/lib/playlistService');

module.exports = {
    async execute(ctx, args = []) {
        if (!requireMusic(ctx)) return;
        if (!requireVoiceChannel(ctx)) return;

        const userId = getUserId(ctx);
        const name = isSlash(ctx) ? ctx.options.getString('nombre') : args.join(' ');

        const playlist = await service.getPlaylist(userId, name);
        if (!playlist) {
            return reply(ctx, {
                ...errorPanel('No encontré esa playlist', `No tenés ninguna playlist llamada **${name}**.`),
                ephemeral: true,
            });
        }

        if (!playlist.trackCount) {
            return reply(ctx, {
                ...warningPanel('La playlist está vacía', `Agregale canciones con \`/playlist agregar ${playlist.name} <canción>\`.`),
                ephemeral: true,
            });
        }

        const member = getMember(ctx);
        const player = await requireOrCreatePlayer(ctx, member.voice.channel);
        if (!player) return;

        // Aviso antes de resolver: son hasta 50 búsquedas contra Lavalink y el
        // token de slash dura 3 segundos. Sin este mensaje previo, Discord
        // muestra "la aplicación no respondió".
        const aviso = await reply(ctx, {
            ...warningPanel('Cargando la playlist', `Buscando ${playlist.trackCount} canción${playlist.trackCount === 1 ? '' : 'es'} de **${playlist.name}**...`),
        }).catch(() => null);

        const { enqueued, notFound } = await service.enqueuePlaylist(
            ctx.client, player, playlist, ctx.user || ctx.author,
        );

        if (!enqueued) {
            const texto = notFound
                ? `Ninguna de las ${notFound} canciones se pudo resolver: los links deben haber caído.`
                : 'No se encontró nada.';
            return reply(ctx, { ...errorPanel('No se pudo reproducir', texto), ephemeral: true });
        }

        if (!player.playing && !player.paused) await player.play();

        const lineas = [`Agregué **${enqueued}** canción${enqueued === 1 ? '' : 'es'} a la cola.`];
        if (notFound > 0) {
            lineas.push(`${notFound} no se pudieron resolver (links caídos) y quedaron afuera.`);
        }

        const payload = successPanel(`Playlist: ${playlist.name}`, lineas.join('\n'), {
            lines: player.queue.size ? `La cola tiene ${player.queue.size} canción${player.queue.size === 1 ? '' : 'es'} en total.` : '',
        });

        // El aviso de "cargando" se reemplaza por el resultado, si se pudo.
        if (aviso?.edit) return aviso.edit(payload).catch(() => reply(ctx, payload));
        return reply(ctx, payload);
    },
};
