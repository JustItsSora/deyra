// src/hybrid/musicconfig/musicconfig.js
//
// Configuración de música del SERVIDOR. Es el puerto de los seis comandos de
// configuración del bot de música viejo (config 247 / autoplay / volume /
// fairplay / fairplayrole + el menú general), reunitedos en un comando con
// subcomandos porque en Deyra ya había un /config para el resto del server y
// tener la música repartida en seis comandos era peor.
//
// Categoría 'configuración' y NO 'música' a propósito: la de música ya tiene 35
// comandos y el registro de slash da 20 cupos por categoría (config.MUSIC
// .MAX_SLASH_PER_CATEGORY). Si esto fuera 'música', /musicconfig casi seguro
// caería fuera de los slash y quedaría solo con prefijo, que es justo lo
// contrario de lo que se necesita.
//
// Uso:
//   /musicconfig ver
//   /musicconfig volumen 60
//   /musicconfig autoplay on
//   /musicconfig fairplay on
//   /musicconfig rol @Rol
//   /musicconfig 247 on|#canal

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { isSlash } = require('../../lib/reply');

const VALID_SUBS = [
    'ver', 'view',
    'volumen', 'volume',
    'autoplay', 'ap',
    'fairplay', 'fp',
    'rol', 'role', 'fairplayrol',
    '247', 'twentyfourseven', '24/7',
    'reset',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('musicconfig')
        .setDescription('Configura la música del servidor (volumen, autoplay, fairplay, 24/7)')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(s => s.setName('ver')
            .setDescription('Muestra la configuración de música actual'))
        .addSubcommand(s => s.setName('volumen')
            .setDescription('Volumen con el que arranca el reproductor')
            .addIntegerOption(o => o.setName('nivel')
                .setDescription('Volumen inicial (0-100)')
                .setMinValue(0).setMaxValue(100).setRequired(true)))
        .addSubcommand(s => s.setName('autoplay')
            .setDescription('Autoplay por defecto al terminar la cola')
            .addStringOption(o => o.setName('estado')
                .setDescription('Activar o desactivar')
                .setRequired(true)
                .addChoices({ name: 'Activar', value: 'on' }, { name: 'Desactivar', value: 'off' })))
        .addSubcommand(s => s.setName('fairplay')
            .setDescription('Restringe la música al rol configurado')
            .addStringOption(o => o.setName('estado')
                .setDescription('Activar o desactivar')
                .setRequired(true)
                .addChoices({ name: 'Activar', value: 'on' }, { name: 'Desactivar', value: 'off' })))
        .addSubcommand(s => s.setName('rol')
            .setDescription('Rol autorizado a controlar la música con fairplay')
            .addRoleOption(o => o.setName('rol').setDescription('Rol (o @everyone para quitarlo)').setRequired(true)))
        .addSubcommand(s => s.setName('247')
            .setDescription('Modo 24/7: el bot se queda solo en un canal'))
        .addSubcommand(s => s.setName('reset')
            .setDescription('Vuelve todo a los valores por defecto de Deyra')),

    name: 'musicconfig',
    aliases: ['musiccfg', 'configmusica', 'mc'],
    category: 'configuración',

    async execute(ctx, args = []) {
        const isSlashCmd = isSlash(ctx);
        const raw = isSlashCmd ? ctx.options.getSubcommand() : (args[0]?.toLowerCase() || 'ver');
        const sub = VALID_SUBS.includes(raw) ? raw : 'ver';

        // El nombre del archivo de subcomando: los alias English van al mismo.
        const file = {
            ver: 'ver', view: 'ver',
            volumen: 'volumen', volume: 'volumen',
            autoplay: 'autoplay', ap: 'autoplay',
            fairplay: 'fairplay', fp: 'fairplay',
            rol: 'rol', role: 'rol', fairplayrol: 'rol',
            '247': 'veintycuatro', '24/7': 'veintycuatro', twentyfourseven: 'veintycuatro',
            reset: 'reset',
        }[sub];

        const subcommandFile = require(`./subcommands/${file}`);
        return subcommandFile.execute(ctx, isSlashCmd ? [] : args.slice(1), { rawSub: sub });
    },
};
