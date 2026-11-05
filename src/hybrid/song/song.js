// /song — ficha de una canción (Deezer, sin API key).
// Trae portada, duración y enlace. No incluye preview de audio: Discord no
// reproduce MP3 embebido, así que el comando deriva en el link.

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { searchSong } = require('../../lib/api/lookupApi');
const ui = require('../../lib/ui');

function duration(seconds) {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('song')
        .setDescription('Busca una canción y muestra su ficha')
        .addStringOption(o => o
            .setName('cancion')
            .setDescription('Título o "artista - título"')
            .setRequired(true)),

    name: 'song',
    aliases: ['cancion', 'deezer', 'track'],
    category: 'diversión',
    cooldownMs: 5000,

    async execute(ctx, args = []) {
        const query = isSlash(ctx) ? ctx.options.getString('cancion') : args.join(' ');
        if (!query) {
            return reply(ctx, ui.missingArgument('Falta la canción', '¿Qué canción querés que busque?', { usage: '/song daft punk around the world' }));
        }

        let song;
        try {
            song = await searchSong(query);
        } catch (err) {
            if (err.notFound) {
                return reply(ctx, ui.empty('No encontré esa canción', `Sin resultados para **${ui.truncate(query, 60)}**.`, { hint: 'Probá con "artista - título".' }));
            }
            console.error('[song] Error:', err.message);
            return reply(ctx, ui.error('No pude consultar Deezer', 'La fuente de música no respondió.', { ephemeral: true }));
        }

        return reply(ctx, ui.imagePayload({
            category: 'música',
            icon: '🎵',
            kicker: 'Deezer',
            title: `${song.title}`,
            caption: `**${song.artist}**${song.album ? `\nÁlbum: *${song.album}*` : ''}`,
            media: song.cover ? { url: song.cover, description: `${song.title} — ${song.artist}` } : null,
            source: 'Deezer',
            sourceUrl: song.url,
            grid: [
                ['Artista', ui.truncate(song.artist, 28)],
                ['Álbum', ui.truncate(song.album || '—', 28)],
                ['Duración', duration(song.duration)],
                ['Preview', song.preview ? '🎧 Disponible' : '—'],
            ],
            callouts: [{ tone: 'muted', text: `Escuchala en Deezer: ${song.url}` }],
        }));
    },
};
