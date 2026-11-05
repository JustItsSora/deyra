// src/hybrid/moderation/moderation.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('mod')
        .setDescription('Comandos de moderación')
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
        .addSubcommand(s => s.setName('ban')
            .setDescription('Banea a un miembro')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a banear').setRequired(true))
            .addStringOption(o => o.setName('razon').setDescription('Razón del baneo').setRequired(false))
            .addIntegerOption(o => o.setName('dias_borrado').setDescription('Días de mensajes a borrar (0-7)').setMinValue(0).setMaxValue(7).setRequired(false)))
        .addSubcommand(s => s.setName('unban')
            .setDescription('Desbanea a un usuario por ID')
            .addStringOption(o => o.setName('id').setDescription('ID del usuario').setRequired(true))
            .addStringOption(o => o.setName('razon').setDescription('Razón').setRequired(false)))
        .addSubcommand(s => s.setName('kick')
            .setDescription('Expulsa a un miembro')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a expulsar').setRequired(true))
            .addStringOption(o => o.setName('razon').setDescription('Razón').setRequired(false)))
        .addSubcommand(s => s.setName('mute')
            .setDescription('Silencia (timeout) a un miembro')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a silenciar').setRequired(true))
            .addStringOption(o => o.setName('duracion').setDescription('Ej: 10m, 1h, 2d (máx 28d)').setRequired(true))
            .addStringOption(o => o.setName('razon').setDescription('Razón').setRequired(false)))
        .addSubcommand(s => s.setName('unmute')
            .setDescription('Quita el silencio a un miembro')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
            .addStringOption(o => o.setName('razon').setDescription('Razón').setRequired(false)))
        .addSubcommand(s => s.setName('softban')
            .setDescription('Banea y desbanea de inmediato (borra mensajes recientes sin expulsar permanentemente)')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
            .addStringOption(o => o.setName('razon').setDescription('Razón').setRequired(false)))
        .addSubcommand(s => s.setName('warn')
            .setDescription('Advierte a un miembro')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
            .addStringOption(o => o.setName('razon').setDescription('Razón').setRequired(true)))
        .addSubcommand(s => s.setName('warnings')
            .setDescription('Muestra las advertencias de un miembro')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)))
        .addSubcommand(s => s.setName('unwarn')
            .setDescription('Elimina una advertencia por ID')
            .addIntegerOption(o => o.setName('id').setDescription('ID de la advertencia').setRequired(true)))
        .addSubcommand(s => s.setName('clearwarnings')
            .setDescription('Elimina todas las advertencias de un miembro')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true)))
        .addSubcommand(s => s.setName('purge')
            .setDescription('Borra mensajes recientes del canal')
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad (1-500)').setMinValue(1).setMaxValue(500).setRequired(true))
            .addUserOption(o => o.setName('usuario').setDescription('Solo mensajes de este usuario o bot').setRequired(false))
            .addBooleanOption(o => o.setName('solo_bots').setDescription('Solo borrar mensajes enviados por bots').setRequired(false))
            .addBooleanOption(o => o.setName('solo_comandos').setDescription('Solo borrar invocaciones de comandos con prefijo (!comando, etc.)').setRequired(false)))
        .addSubcommand(s => s.setName('nickname')
            .setDescription('Cambia el apodo de un miembro')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
            .addStringOption(o => o.setName('nuevo_nombre').setDescription('Nuevo apodo (vacío para quitarlo)').setRequired(false)))
        .addSubcommand(s => s.setName('banlist')
            .setDescription('Muestra la lista de usuarios baneados'))
        .addSubcommand(s => s.setName('pinmsg')
            .setDescription('Fija un mensaje por su ID en este canal')
            .addStringOption(o => o.setName('message_id').setDescription('ID del mensaje a fijar').setRequired(true)))
        .addSubcommand(s => s.setName('unpinmsg')
            .setDescription('Desfija un mensaje por su ID en este canal')
            .addStringOption(o => o.setName('message_id').setDescription('ID del mensaje a desfijar').setRequired(true))),

    name: 'mod',
    aliases: ['moderation'],
    category: 'moderación',

    async execute(interactionOrMessage, args = []) {
        const isSlash = interactionOrMessage.isCommand?.();
        let subcommand;

        if (isSlash) {
            subcommand = interactionOrMessage.options.getSubcommand();
        } else {
            subcommand = args[0]?.toLowerCase();
            args = args.slice(1);
        }

        const aliasMap = {
            b: 'ban', k: 'kick', m: 'mute', um: 'unmute', ub: 'unban',
            w: 'warn', ws: 'warnings', cw: 'clearwarnings', p: 'purge', nick: 'nickname',
        };
        subcommand = aliasMap[subcommand] || subcommand;

        const validSubs = ['ban', 'unban', 'kick', 'mute', 'unmute', 'softban', 'warn', 'warnings', 'unwarn', 'clearwarnings', 'purge', 'nickname', 'banlist', 'pinmsg', 'unpinmsg'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/mod <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
