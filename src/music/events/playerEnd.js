function extractCoreName(title) {
  let core = title.toLowerCase();
  core = core.replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '');
  core = core.replace(/official|video|audio|lyric|lyrics|music|song|full|hd|4k|8k|version|remix|edit|remaster/gi, '');
  core = core.replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, ' ').trim();
  return core;
}

function isSimilarTitle(title1, title2) {
  const core1 = extractCoreName(title1);
  const core2 = extractCoreName(title2);
  if (core1 === core2) return true;
  if (core1.length > 3 && core2.length > 3) {
    if (core1.includes(core2) || core2.includes(core1)) return true;
  }
  const words1 = core1.split(' ').filter(w => w.length > 2);
  const words2 = core2.split(' ').filter(w => w.length > 2);
  if (words1.length === 0 || words2.length === 0) return core1 === core2;
  const commonWords = words1.filter(w => words2.includes(w));
  const similarity = commonWords.length / Math.max(words1.length, words2.length);
  return similarity > 0.6;
}

module.exports = {
  name: 'playerEnd',
  run: async (client, player, track) => {
    try {
      if (track) {
        let history = player.data?.get('history') || [];
        if (history.length === 0 || history[history.length - 1]?.uri !== track.uri) {
          history.push({
            title: track.title,
            author: track.author,
            uri: track.uri,
            length: track.length,
            thumbnail: track.thumbnail,
            requester: track.requester,
            identifier: track.identifier,
            sourceName: track.sourceName
          });
          if (history.length > 20) history.shift();
          player.data?.set('history', history);
        }
      }

      player.data.get('message')?.delete().catch(() => {});

      const guild = client.guilds.cache.get(player.guildId);
      if (!guild) return;

      if (player.queue && player.queue.size > 0) return;
      if (player.playing) return;

      const autoplay = player.data?.get('autoplay');
      if (autoplay && track) {
        const history = player.data?.get('history') || [];
        const cleanAuthor = (track.author || '').replace(/\s*-\s*Topic\s*$/i, '').trim();
        const cleanTitle = (track.title || '').replace(/\(.*?\)/g, '').replace(/\[.*?\]/g, '').trim();

        const query = `${cleanAuthor} ${cleanTitle}`.trim();
        if (query) {
          try {
            const result = await client.music.search(query, { requester: client.user });
            if (result?.tracks?.length > 0) {
              const nextTrack = result.tracks.find(t => {
                const inHistory = history.some(h => h.uri === t.uri || h.identifier === t.identifier || isSimilarTitle(h.title, t.title));
                const isCurrent = t.uri === track.uri || t.identifier === track.identifier || isSimilarTitle(t.title, track.title);
                return !inHistory && !isCurrent;
              }) || result.tracks[0];

              if (nextTrack) {
                player.queue.add(nextTrack);
                if (!player.playing && !player.paused) await player.play();
              }
            }
          } catch (_) {}
        }
      }
    } catch (_) {}
  }
};
