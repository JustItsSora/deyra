// src/hybrid/playlist/playlist.js
//
// Playlists personales. Puerto de los seis comandos de biblioteca del bot de
// música viejo (playlist-create, playlist-add, playlist-tracks, playlist-list,
// playlist-edit, playlist-play), en un comando con subcomandos.
//
// ¿Un comando con subcomandos y no seis sueltos? Porque acá ya existe un /config
// con subcomandos, así que el patrón está; y seis comandos más de biblioteca
// sumaban seis entradas de prefijo y seis nombres que la gente tiene que
// acordarse (/playlist-add, /playlistadd, /playlisttracks... el bot viejo tenía
// alias distintos para cada uno y algunos colisionaban entre sí: playlistList.ts
// y playlistTracks.ts se llamaban las dos "playlists", y una tapaba a la otra sin
// aviso).
//
// Uso:
//   /playlist crear <nombre>
//   /playlist agregar <nombre> <cancionalgo>
//   /playlist quitar <nombre> <posición>
//   /playlist mover <nombre> <de> <a>
//   /playlist lista
//   /playlist canciones <nombre>
//   /playlist reproducir <nombre>
//   /playlist renombrar <nombre> <nuevo>
//   /playlist borrar <nombre>

const { SlashCommandBuilder, MessageFlags } = require('discord.js');
const { isSlash } = require('../../lib/reply');

const SUBS = {
    crear: 'crear', create: 'crear', nueva: 'crear',
    agregar: 'agregar', add: 'agregar', anadir: 'agregar',
    quitar: 'quitar', remove: 'quitar', borrarcancion: 'quitar',
    mover: 'mover', move: 'mover',
    lista: 'lista', list: 'lista', listar: 'lista',
    canciones: 'canciones', tracks: 'canciones', ver: 'canciones',
    reproducir: 'reproducir', play: 'reproducir',
    renombrar: 'renombrar', rename: 'renombrar', edit: 'renombrar',
    borrar: 'borrar', delete: 'borrar', eliminar: 'borrar',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('playlist')
        .setDescription('Administra tus playlists personales')
        .addSubcommand(s => s.setName('crear')
            .setDescription('Crea una playlist vacía')
            .addStringOption(o => o.setName('nombre').setDescription('Nombre de la playlist').setRequired(true)))
        .addSubcommand(s => s.setName('agregar')
            .setDescription('Agrega canciones a una playlist')
            .addStringOption(o => o.setName('nombre').setDescription('Playlist').setRequired(true).setAutocomplete(true))
            .addStringOption(o => o.setName('cancion').setDescription('Canción, link o nombre').setRequired(true)))
        .addSubcommand(s => s.setName('quitar')
            .setDescription('Saca una canción de una playlist por posición')
            .addStringOption(o => o.setName('nombre').setDescription('Playlist').setRequired(true).setAutocomplete(true))
            .addIntegerOption(o => o.setName('posicion').setDescription('Número de la canción (1 = la primera)').setMinValue(1).setRequired(true)))
        .addSubcommand(s => s.setName('mover')
            .setDescription('Mueve una canción de posición')
            .addStringOption(o => o.setName('nombre').setDescription('Playlist').setRequired(true).setAutocomplete(true))
            .addIntegerOption(o => o.setName('desde').setDescription('Posición actual').setMinValue(1).setRequired(true))
            .addIntegerOption(o => o.setName('hasta').setDescription('Posición nueva').setMinValue(1).setRequired(true)))
        .addSubcommand(s => s.setName('lista')
            .setDescription('Muestra todas tus playlists'))
        .addSubcommand(s => s.setName('canciones')
            .setDescription('Muestra las canciones de una playlist')
            .addStringOption(o => o.setName('nombre').setDescription('Playlist').setRequired(true).setAutocomplete(true)))
        .addSubcommand(s => s.setName('reproducir')
            .setDescription('Agrega una playlist entera a la cola')
            .addStringOption(o => o.setName('nombre').setDescription('Playlist').setRequired(true).setAutocomplete(true)))
        .addSubcommand(s => s.setName('renombrar')
            .setDescription('Cambia el nombre de una playlist')
            .addStringOption(o => o.setName('nombre').setDescription('Playlist actual').setRequired(true).setAutocomplete(true))
            .addStringOption(o => o.setName('nuevo').setDescription('Nombre nuevo').setRequired(true)))
        .addSubcommand(s => s.setName('borrar')
            .setDescription('Borra una playlist y todas sus canciones')
            .addStringOption(o => o.setName('nombre').setDescription('Playlist').setRequired(true).setAutocomplete(true))),

    name: 'playlist',
    aliases: ['playlists', 'pl'],
    category: 'música',
    cooldownMs: 3000,

    /** Autocomplete de nombres de playlist (propio del usuario). */
    async autocomplete(interaction) {
        const service = require('../../music/lib/playlistService');
        const rows = await service.listPlaylists(interaction.user.id);
        const term = interaction.options.getFocused().toLowerCase();
        const matches = term ? rows.filter((r) => r.name.toLowerCase().includes(term)) : rows;

        await interaction.respond(
            matches.slice(0, 25).map((r) => ({
                name: `${r.name} (${r.trackCount})`.slice(0, 100),
                value: r.name,
            })),
        ).catch(() => {});
    },

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getSubcommand() : (args[0]?.toLowerCase() || 'lista');
        const file = SUBS[raw];

        if (!file) {
            const usage = 'Uso: `/playlist <'
                + `${Object.keys(SUBS).filter((k, i) => Object.keys(SUBS).indexOf(k) === i).join('|')}`
                + '>`';
            return isSlash(ctx)
                ? ctx.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : ctx.reply(usage);
        }

        return require(`./subcommands/${file}`).execute(ctx, isSlash(ctx) ? [] : args.slice(1));
    },
};
