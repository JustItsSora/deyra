// src/music/lib/playlistService.js
//
// CRUD de playlists. Es la única capa que escribe en music_playlists y
// music_playlist_tracks, y existe por una razón concreta: mantener el contador
// `trackCount` al día.
//
// El contador es desnormalizado a propósito (está en la tabla de la playlist y
// no se cuenta con un COUNT en cada fila de /playlistlist), así que TODA
// operación que agregue o saque canciones tiene que pasar por acá. Si un
// comando futuro borra un track con MusicPlaylistTrack.destroy() directo, el
// contador queda mintiendo y /playlistlist muestra "12 canciones" para una
// playlist de 9. Es el tipo de bug que aparece tres meses después y nadie
// recuerda por qué.
//
// Puerto del bot de música viejo (tablas playlists + playlist_tracks), con
// tres diferencias:
//
//   · ID propio (UUID) en vez de un id corto de 6 caracteres en base36. El id
//     viejo se podía volver a generar por colisión entre servidores; el UUID no.
//   · Los tracks se guardan con los campos sueltos (título, uri, duración,
//     miniatura) en vez de un `encoded` opaco. Así /playlisttracks puede
//     mostrar la lista sin volver a preguntarle a Lavalink, que ya no tiene esa
//     pista: si la playlist se armó hace un mes, el link puede estar caído y
//     aun así querés ver qué había.
//   · Sin límite de tiempo: los juegos del bot viejo (autoplay, filtros) que
//     exigían voto o premium NO se replican. Ver src/music/lib/access.js para
//     los límites que sí existen y por qué.

const { Op } = require('sequelize');
const { MusicPlaylist, MusicPlaylistTrack } = require('../../data/models');

/** Normaliza un track de Kazagumo/Lavalink a la fila que se guarda. */
function trackToRow(track, position, requesterId) {
    return {
        position,
        identifier: track.identifier || track.uri || 'desconocida',
        title: (track.title || 'Sin título').slice(0, 250),
        uri: (track.uri || '').slice(0, 500) || null,
        author: (track.author || '').slice(0, 250) || null,
        length: Number.isFinite(track.length) ? track.length : 0,
        thumbnail: (track.thumbnail || track.artworkUrl || '').slice(0, 500) || null,
        source: (track.sourceName || '').slice(0, 40) || null,
        requesterId: requesterId || track.requester?.id || null,
    };
}

/** Crea la playlist. Devuelve { playlist } o { error }. */
async function createPlaylist(userId, name, { description = null, isPublic = false } = {}) {
    const clean = String(name || '').trim().slice(0, 60);
    if (!clean) return { error: 'Falta el nombre de la playlist.' };

    const existing = await MusicPlaylist.findOne({ where: { userId, name: clean } });
    if (existing) return { error: `Ya tenés una playlist llamada **${clean}**.` };

    const playlist = await MusicPlaylist.create({
        userId,
        name: clean,
        description: description ? String(description).slice(0, 300) : null,
        isPublic,
        trackCount: 0,
    });

    return { playlist };
}

async function getPlaylist(userId, nameOrId) {
    const ref = String(nameOrId || '').trim();
    if (!ref) return null;

    // Por id (para /playlistplay con autocomplete) o por nombre.
    return MusicPlaylist.findOne({
        where: {
            userId,
            [Op.or]: [
                { id: ref },
                { name: { [Op.like]: ref } },
            ],
        },
    });
}

async function listPlaylists(userId) {
    return MusicPlaylist.findAll({
        where: { userId },
        order: [['createdAt', 'ASC']],
    });
}

/** Canciones de una playlist, en orden. */
async function getTracks(playlistId) {
    return MusicPlaylistTrack.findAll({
        where: { playlistId },
        order: [['position', 'ASC']],
    });
}

/** Recalcula trackCount desde la tabla de tracks (auto-reparación). */
async function refreshCount(playlist) {
    const total = await MusicPlaylistTrack.count({ where: { playlistId: playlist.id } });
    if (playlist.trackCount !== total) {
        playlist.trackCount = total;
        await playlist.save();
    }
    return total;
}

/**
 * Agrega canciones al final. No sobreescribe `position` de las que ya están:
 * se agrega desde el contador real, no desde `trackCount`, que podría estar
 * desfasado.
 *
 * @returns {{added: number, skipped: number, duplicate: string[]}}
 */
async function addTracks(playlist, tracks, requesterId) {
    const existentes = await getTracks(playlist.id);
    const yaHay = new Set(existentes.map((t) => t.identifier));
    let position = existentes.length;

    const nuevos = [];
    const duplicate = [];

    for (const track of tracks) {
        const identifier = track.identifier || track.uri || 'desconocida';
        if (yaHay.has(identifier)) {
            duplicate.push(track.title || identifier);
            continue;
        }
        yaHay.add(identifier);
        nuevos.push(trackToRow(track, position++, requesterId));
    }

    if (nuevos.length) await MusicPlaylistTrack.bulkCreate(nuevos);
    await refreshCount(playlist);

    return { added: nuevos.length, skipped: duplicate.length, duplicate };
}

/** Quita por posición (1-based, como se lo ve en /playlisttracks). */
async function removeAtPosition(playlist, position) {
    const tracks = await getTracks(playlist.id);
    const track = tracks[position - 1];
    if (!track) return { removed: null };

    await track.destroy();

    // Reindexar: las posiciones tienen que quedar 0..n-1 o el "siguiente" se
    // corre y la lista muestra huecos.
    const restantes = tracks.filter((t) => t.id !== track.id);
    await Promise.all(restantes.map((t, i) => {
        if (t.position !== i) {
            t.position = i;
            return t.save();
        }
        return null;
    }));

    await refreshCount(playlist);
    return { removed: track };
}

/** Mueve una canción de posición (para /playlistmove). */
async function moveTrack(playlist, fromPos, toPos) {
    const tracks = await getTracks(playlist.id);
    if (fromPos < 1 || fromPos > tracks.length || toPos < 1 || toPos > tracks.length) {
        return { error: 'Alguna de las posiciones no existe.' };
    }

    const reordered = [...tracks];
    const [moved] = reordered.splice(fromPos - 1, 1);
    reordered.splice(toPos - 1, 0, moved);

    await Promise.all(reordered.map((t, i) => {
        if (t.position !== i) {
            t.position = i;
            return t.save();
        }
        return null;
    }));

    return { moved };
}

async function renamePlaylist(playlist, newName) {
    const clean = String(newName || '').trim().slice(0, 60);
    if (!clean) return { error: 'Falta el nombre nuevo.' };
    if (clean === playlist.name) return { error: 'Es el mismo nombre.' };

    const clash = await MusicPlaylist.findOne({
        where: { userId: playlist.userId, name: clean, id: { [Op.ne]: playlist.id } },
    });
    if (clash) return { error: `Ya tenés una playlist llamada **${clean}**.` };

    playlist.name = clean;
    await playlist.save();
    return { playlist };
}

/** Borra la playlist y sus canciones (CASCADE en el modelo). */
async function deletePlaylist(playlist) {
    await MusicPlaylistTrack.destroy({ where: { playlistId: playlist.id } });
    await playlist.destroy();
    return true;
}

/** Pide al reproductor las canciones de una playlist y las encola. */
async function enqueuePlaylist(client, player, playlist, requester) {
    const rows = await getTracks(playlist.id);

    if (!rows.length) {
        return { enqueued: 0, notFound: 0, total: rows.length };
    }

    // Cada fila se resuelve por su uri (o por su identifier si no hay uri).
    // Se arman en paralelo de a 8 porque una playlist de 50 canciones
    // resueltas de a una tarda más de lo que Discord tolera antes de cortar la
    // interacción: el token de slash dura 3 segundos y cada búsqueda tarda
    // entre 200 ms y 2 s.
    const resultados = [];
    for (let i = 0; i < rows.length; i += 8) {
        const tanda = rows.slice(i, i + 8);
        const resueltos = await Promise.all(tanda.map(async (row) => {
            try {
                const res = await player.search(row.uri || row.identifier, { requester });
                if (res?.tracks?.length) return res.tracks[0];
            } catch (_) {}
            return null;
        }));
        resueltos.forEach((track, idx) => resultados.push({ row: tanda[idx], track }));
    }

    let enqueued = 0;
    for (const { track } of resultados) {
        if (!track) continue;
        player.queue.add(track);
        enqueued++;
    }

    return { enqueued, notFound: rows.length - enqueued, total: rows.length };
}

module.exports = {
    createPlaylist,
    getPlaylist,
    listPlaylists,
    getTracks,
    addTracks,
    removeAtPosition,
    moveTrack,
    renamePlaylist,
    deletePlaylist,
    refreshCount,
    enqueuePlaylist,
    trackToRow,
};
