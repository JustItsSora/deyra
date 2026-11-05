// src/music/lib/trackFormat.js
// Formateo compartido de datos de una track (Kazagumo/Lavalink) para mostrar
// en los paneles de los comandos de música.

function formatDuration(ms) {
    if (!ms || ms <= 0) return 'En vivo';
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}:${String(minutes % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
    }
    return `${minutes}:${String(seconds % 60).padStart(2, '0')}`;
}

function cleanAuthorName(author, maxLength = 25) {
    if (!author) return 'Artista desconocido';
    const cleaned = author.replace(/\s*-\s*Topic\s*$/i, '').trim();
    return cleaned.length > maxLength ? `${cleaned.substring(0, maxLength)}...` : cleaned;
}

function truncateTitle(title, maxLength = 40) {
    if (!title) return 'Título desconocido';
    return title.length <= maxLength ? title : `${title.substring(0, maxLength)}...`;
}

function getCleanThumbnail(thumbnailUrl) {
    if (!thumbnailUrl) return null;
    if (thumbnailUrl.includes('i.ytimg.com') || thumbnailUrl.includes('img.youtube.com')) {
        const videoIdMatch = thumbnailUrl.match(/vi\/([^/]+)\//);
        if (videoIdMatch?.[1]) return `https://i.ytimg.com/vi/${videoIdMatch[1]}/maxresdefault.jpg`;
    }
    return thumbnailUrl;
}

module.exports = { formatDuration, cleanAuthorName, truncateTitle, getCleanThumbnail };
