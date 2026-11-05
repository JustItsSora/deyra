// src/hybrid/automod/automod.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('automod')
        .setDescription('Configura el sistema de automoderación')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(s => s.setName('toggle')
            .setDescription('Activa o desactiva el automod por completo')
            .addBooleanOption(o => o.setName('activo').setDescription('true para activar, false para desactivar').setRequired(true)))
        .addSubcommand(s => s.setName('feature')
            .setDescription('Activa o desactiva una protección específica')
            .addStringOption(o => o.setName('proteccion').setDescription('Qué proteger').setRequired(true)
                .addChoices(
                    { name: 'Invitaciones de Discord', value: 'antiInvite' },
                    { name: 'Enlaces', value: 'antiLink' },
                    { name: 'Spam', value: 'antiSpam' },
                    { name: 'Menciones masivas', value: 'antiMention' },
                    { name: 'Mayúsculas excesivas', value: 'antiCaps' },
                    { name: 'Palabras prohibidas', value: 'antiBadWords' },
                ))
            .addBooleanOption(o => o.setName('activo').setDescription('true para activar, false para desactivar').setRequired(true)))
        .addSubcommand(s => s.setName('logchannel')
            .setDescription('Define el canal donde se registran las acciones del automod')
            .addChannelOption(o => o.setName('canal').setDescription('Canal de logs').setRequired(true)))
        .addSubcommand(s => s.setName('action')
            .setDescription('Define qué pasa cuando se detecta una infracción')
            .addStringOption(o => o.setName('accion').setDescription('Acción a tomar').setRequired(true)
                .addChoices(
                    { name: 'Solo borrar el mensaje', value: 'delete' },
                    { name: 'Borrar y advertir', value: 'warn' },
                    { name: 'Borrar y silenciar 10 min', value: 'mute' },
                    { name: 'Borrar y expulsar', value: 'kick' },
                    { name: 'Borrar y banear', value: 'ban' },
                )))
        .addSubcommand(s => s.setName('allowlink')
            .setDescription('Gestiona los dominios que se pueden compartir con anti-enlaces activo')
            .addStringOption(o => o.setName('accion').setDescription('add, remove o list').setRequired(true).addChoices({ name: 'Añadir', value: 'add' }, { name: 'Quitar', value: 'remove' }, { name: 'Listar', value: 'list' }))
            .addStringOption(o => o.setName('dominio').setDescription('Dominio, p.ej. youtube.com (o una URL completa)').setRequired(false)))
        .addSubcommand(s => s.setName('escalation')
            .setDescription('Sanción mayor automática al acumular infracciones')
            .addStringOption(o => o.setName('accion').setDescription('Qué pasa al superar el umbral').setRequired(true)
                .addChoices(
                    { name: 'Desactivada', value: 'off' },
                    { name: 'Silenciar 1 hora', value: 'timeout' },
                    { name: 'Expulsar', value: 'kick' },
                    { name: 'Banear', value: 'ban' }))
            .addIntegerOption(o => o.setName('umbral').setDescription('Infracciones en 30 días (por defecto 5)').setRequired(false).setMinValue(1).setMaxValue(100)))
        .addSubcommand(s => s.setName('badword')
            .setDescription('Añade o quita una palabra de la lista de prohibidas')
            .addStringOption(o => o.setName('accion').setDescription('add o remove').setRequired(true).addChoices({ name: 'Añadir', value: 'add' }, { name: 'Quitar', value: 'remove' }))
            .addStringOption(o => o.setName('palabra').setDescription('La palabra').setRequired(true)))
        .addSubcommand(s => s.setName('whitelist')
            .setDescription('Excluye un canal o rol de las protecciones del automod')
            .addStringOption(o => o.setName('tipo').setDescription('canal o rol').setRequired(true).addChoices({ name: 'Canal', value: 'channel' }, { name: 'Rol', value: 'role' }))
            .addStringOption(o => o.setName('accion').setDescription('add o remove').setRequired(true).addChoices({ name: 'Añadir', value: 'add' }, { name: 'Quitar', value: 'remove' }))
            .addMentionableOption(o => o.setName('objetivo').setDescription('Canal o rol (usa # o @)').setRequired(false)))
        .addSubcommand(s => s.setName('aifilter')
            .setDescription('Segunda opinión con IA sobre palabras prohibidas y mayúsculas')
            .addBooleanOption(o => o.setName('activo')
                .setDescription('true para activar, false para desactivar')
                .setRequired(false)))
        .addSubcommand(s => s.setName('status')
            .setDescription('Muestra la configuración actual del automod'))
        .addSubcommand(s => s.setName('testword')
            .setDescription('Prueba si una palabra activaría el filtro de palabras prohibidas')
            .addStringOption(o => o.setName('palabra').setDescription('Palabra a probar').setRequired(true))),

    name: 'automod',
    aliases: [],
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

        const validSubs = ['toggle', 'feature', 'logchannel', 'action', 'allowlink', 'escalation', 'badword', 'whitelist', 'aifilter', 'status', 'testword'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/automod <${validSubs.join('|')}>\` (configuración completa recomendada vía slash)`;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
