// src/hybrid/ticket/ticket.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Gestiona el sistema de tickets')
        .addSubcommand(s => s.setName('setup')
            .setDescription('Configura el sistema de tickets (categoría, rol de soporte, canal de logs)')
            .addChannelOption(o => o.setName('categoria').setDescription('Categoría donde se crearán los tickets').setRequired(true))
            .addRoleOption(o => o.setName('rol_soporte').setDescription('Rol que puede ver y atender tickets').setRequired(true))
            .addChannelOption(o => o.setName('canal_logs').setDescription('Canal donde se registran cierres de tickets').setRequired(false)))
        .addSubcommand(s => s.setName('panel')
            .setDescription('Envía el panel de creación de tickets a un canal')
            .addChannelOption(o => o.setName('canal').setDescription('Canal donde enviar el panel').setRequired(true))
            .addStringOption(o => o.setName('titulo').setDescription('Título del panel').setRequired(false))
            .addStringOption(o => o.setName('descripcion').setDescription('Descripción del panel').setRequired(false)))
        .addSubcommand(s => s.setName('close')
            .setDescription('Cierra el ticket actual')
            .addStringOption(o => o.setName('razon').setDescription('Razón del cierre').setRequired(false)))
        .addSubcommand(s => s.setName('claim')
            .setDescription('Te asignas este ticket'))
        .addSubcommand(s => s.setName('unclaim')
            .setDescription('Te quitas la asignación de este ticket'))
        .addSubcommand(s => s.setName('add')
            .setDescription('Añade a un usuario a este ticket')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a añadir').setRequired(true)))
        .addSubcommand(s => s.setName('remove')
            .setDescription('Quita a un usuario de este ticket')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a quitar').setRequired(true)))
        .addSubcommand(s => s.setName('stats')
            .setDescription('Muestra estadísticas de tickets del servidor')),

    name: 'ticket',
    aliases: ['tickets'],
    category: 'tickets',
    defaultMemberPermissions: PermissionFlagsBits.ManageChannels,

    async execute(interactionOrMessage, args = []) {
        const isSlash = interactionOrMessage.isCommand?.();
        let subcommand;

        if (isSlash) {
            subcommand = interactionOrMessage.options.getSubcommand();
        } else {
            subcommand = args[0]?.toLowerCase();
            args = args.slice(1);
        }

        const validSubs = ['setup', 'panel', 'close', 'claim', 'unclaim', 'add', 'remove', 'stats'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/ticket <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
