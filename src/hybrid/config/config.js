// src/hybrid/config/config.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Configura ajustes generales del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(s => s.setName('prefix').setDescription('Cambia el prefijo de comandos de texto')
            .addStringOption(o => o.setName('nuevo_prefijo').setDescription('Nuevo prefijo (máx 5 caracteres)').setRequired(true)))
        .addSubcommand(s => s.setName('modlog').setDescription('Define el canal de logs de moderación')
            .addChannelOption(o => o.setName('canal').setDescription('Canal de logs').setRequired(true)))
        .addSubcommand(s => s.setName('memberlog').setDescription('Define el canal de registros de entrada/salida de miembros')
            .addChannelOption(o => o.setName('canal').setDescription('Canal de logs de miembros').setRequired(true)))
        .addSubcommand(s => s.setName('messagelog').setDescription('Define el canal de registros de mensajes borrados/editados')
            .addChannelOption(o => o.setName('canal').setDescription('Canal de logs de mensajes').setRequired(true)))
        .addSubcommand(s => s.setName('muterole').setDescription('Define el rol usado para silenciar manualmente')
            .addRoleOption(o => o.setName('rol').setDescription('Rol de silencio').setRequired(true)))
        .addSubcommand(s => s.setName('view').setDescription('Muestra la configuración actual del servidor')),

    name: 'config',
    aliases: ['settings', 'configuracion'],
    category: 'configuración',

    async execute(interactionOrMessage, args = []) {
        const isSlash = interactionOrMessage.isCommand?.();
        let subcommand;

        if (isSlash) {
            subcommand = interactionOrMessage.options.getSubcommand();
        } else {
            subcommand = args[0]?.toLowerCase() || 'view';
            args = args.slice(1);
        }

        const validSubs = ['prefix', 'modlog', 'memberlog', 'messagelog', 'muterole', 'view'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/config <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
