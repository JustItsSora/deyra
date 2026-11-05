const { Kazagumo, KazagumoTrack } = require('kazagumo');
const { Connectors } = require('shoukaku');
const config = require('../config');

const printLoading = (msg) => console.log(`[boot] Cargando ${msg}...`);
const printSuccess = (msg) => console.log(`[boot] ${msg}`);
const printError = (msg) => console.error(`[music] ${msg}`);
const printInfo = (msg) => console.log(`[boot] ${msg}`);

const searchEngines = {
  YOUTUBE: 'ytsearch',
  YOUTUBE_MUSIC: 'ytmsearch',
  SPOTIFY: 'spsearch',
  SOUNDCLOUD: 'scsearch'
};

const fallbackEngines = ['ytmsearch', 'ytsearch', 'scsearch'];

function processSearchResult(res, requester) {
  if (!res) return { type: 'SEARCH', tracks: [] };
  const loadType = res.loadType?.toUpperCase() || '';

  try {
    if (loadType.includes('TRACK')) {
      const trackData = res.data || (res.tracks ? res.tracks[0] : null);
      if (!trackData) return { type: 'SEARCH', tracks: [] };
      return { type: 'TRACK', tracks: [new KazagumoTrack(trackData, requester)] };
    }

    if (loadType.includes('PLAYLIST')) {
      const playlistData = res.data || res;
      const tracks = playlistData.tracks || res.tracks || [];
      const name = playlistData.info?.name || res.playlistInfo?.name || 'Unknown Playlist';
      return {
        type: 'PLAYLIST',
        playlistName: name,
        tracks: (Array.isArray(tracks) ? tracks : []).map((track) => new KazagumoTrack(track, requester))
      };
    }

    if (loadType.includes('SEARCH') || Array.isArray(res.data) || Array.isArray(res.tracks)) {
      let tracks = [];
      if (Array.isArray(res.data)) tracks = res.data;
      else if (res.data?.tracks) tracks = res.data.tracks;
      else if (Array.isArray(res.tracks)) tracks = res.tracks;

      return {
        type: 'SEARCH',
        tracks: tracks.map((track) => new KazagumoTrack(track, requester))
      };
    }
  } catch (e) {
    printError(`[Music] Result processing error: ${e.message}`);
  }
  return { type: 'SEARCH', tracks: [] };
}

function loadMusicManager(client) {
  const musicConfig = config.MUSIC;

  if (!musicConfig || !Array.isArray(musicConfig.NODES) || musicConfig.NODES.length === 0) {
    // El mensaje tiene que decir qué hacer. "Módulo desactivado" sin más deja
    // al que administra el bot pensando que el código anda mal, cuando lo que
    // falta es una variable de entorno.
    printInfo('música desactivada — no hay nodos de Lavalink configurados.');
    printInfo('   Para activarla: poné LAVALINK_URL y LAVALINK_PASSWORD en el .env y reiniciá.');
    printInfo('   Lavalink es Java y come ~300MB de RAM, así que corre aparte del bot (VPS, contenedor, o tu PC con un túnel).');
    return null;
  }

  printLoading('motor de música (Lavalink)');

  const plugins = [];
  if (musicConfig.SPOTIFY_CLIENT_ID && musicConfig.SPOTIFY_CLIENT_SECRET) {
    try {
      const Spotify = require('kazagumo-spotify');
      plugins.push(new Spotify({
        clientId: musicConfig.SPOTIFY_CLIENT_ID,
        clientSecret: musicConfig.SPOTIFY_CLIENT_SECRET,
        playlistPageLimit: 1,
        albumPageLimit: 1,
        searchLimit: 10
      }));
    } catch (_) {
      printError('kazagumo-spotify no está instalado — enlaces de Spotify desactivados.');
    }
  }

  const manager = new Kazagumo(
    {
      defaultSearchEngine: musicConfig.DEFAULT_SEARCH_ENGINE || 'ytmsearch',
      send: (guildId, payload) => {
        const guild = client.guilds.cache.get(guildId);
        if (guild) guild.shard.send(payload);
      },
      plugins
    },
    new Connectors.DiscordJS(client),
    musicConfig.NODES.map(n => ({
      name: n.name,
      url: n.url,
      auth: n.auth,
      secure: !!n.secure
    }))
  );

  manager.searchEngines = searchEngines;

  const originalSearch = manager.search.bind(manager);

  manager.search = async function (query, options = {}) {
    const node = [...this.shoukaku.nodes.values()].find(n => n.state === 1) || [...this.shoukaku.nodes.values()][0];
    if (!node) return { type: 'SEARCH', tracks: [] };

    let cleanQuery = query.trim().replace(/[<>]/g, '');

    const ytIdRegex = /(?:youtube\.com\/(?:[^/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?/\s]{11})/;
    const ytMatch = cleanQuery.match(ytIdRegex);
    const videoId = ytMatch ? ytMatch[1] : null;

    if (videoId) {
      cleanQuery = `https://www.youtube.com/watch?v=${videoId}`;
    }

    const isUrl = /^https?:\/\//.test(cleanQuery);
    const isYouTube = cleanQuery.includes('youtube.com') || cleanQuery.includes('youtu.be');

    if (isYouTube) {
      const strategies = videoId
        ? [cleanQuery, `ytsearch:${videoId}`, `ytmsearch:${videoId}`]
        : [cleanQuery, `ytsearch:${cleanQuery}`, `ytmsearch:${cleanQuery}`];

      for (const q of strategies) {
        const res = await node.rest.resolve(q).catch(() => null);
        if (res && !['EMPTY', 'ERROR', 'NO_MATCHES'].includes(res.loadType)) {
          const result = processSearchResult(res, options.requester);
          if (result.tracks.length > 0) return result;
        }
      }
    }

    if (!isUrl) {
      let searchEngineList = [options.engine || this.defaultSearchEngine];
      if (!options.engine) {
        searchEngineList = [...new Set([...searchEngineList, ...fallbackEngines])];
      }

      for (const engine of searchEngineList) {
        if (!engine) continue;
        const searchQuery = engine.includes(':') ? cleanQuery : `${engine}:${cleanQuery}`;
        const searchRes = await node.rest.resolve(searchQuery).catch(() => null);
        if (searchRes && !['EMPTY', 'ERROR', 'NO_MATCHES'].includes(searchRes.loadType)) {
          return processSearchResult(searchRes, options.requester);
        }
      }
    }

    return originalSearch(cleanQuery, options);
  };

  manager.on('nodeConnect', (node) => printSuccess(`Nodo de Lavalink "${node.name}" conectado.`));
  manager.on('nodeError', (node, error) => printError(`Nodo de Lavalink "${node.name}": ${error.message}`));
  manager.on('nodeDisconnect', (node, reason) => printInfo(`Nodo de Lavalink "${node.name}" desconectado: ${reason || 'desconocido'}`));

  manager.on('error', (error) => {
    if (error?.message?.includes('Connection exist but player not found')) return;
    printError(error.message);
  });

  manager.shoukaku.on('ready', (name) => printSuccess(`Núcleo de Lavalink "${name}" listo.`));
  manager.shoukaku.on('error', (name, error) => printError(`Núcleo de Lavalink "${name}": ${error}`));

  client.music = manager;
  return manager;
}

module.exports = { loadMusicManager };
