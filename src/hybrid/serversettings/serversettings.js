// src/hybrid/serversettings/serversettings.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serversettings')
        .setDescription('Consulta y ajusta configuraciones nativas del servidor de Discord')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(s => s.setName('view')
            .setDescription('Muestra la configuración nativa actual del servidor'))
        .addSubcommand(s => s.setName('verificationlevel')
            .setDescription('Cambia el nivel de verificación requerido para unirse')
            .addStringOption(o => o.setName('nivel').setDescription('Nivel de verificación').setRequired(true)
                .addChoices(
                    { name: 'Ninguno', value: 'None' },
                    { name: 'Bajo', value: 'Low' },
                    { name: 'Medio', value: 'Medium' },
                    { name: 'Alto', value: 'High' },
                    { name: 'Muy alto', value: 'VeryHigh' },
                )))
        .addSubcommand(s => s.setName('explicitfilter')
            .setDescription('Cambia el filtro de contenido explícito para nuevos miembros')
            .addStringOption(o => o.setName('nivel').setDescription('Nivel del filtro').setRequired(true)
                .addChoices(
                    { name: 'Desactivado', value: 'Disabled' },
                    { name: 'Miembros sin rol', value: 'MembersWithoutRoles' },
                    { name: 'Todos los miembros', value: 'AllMembers' },
                )))
        .addSubcommand(s => s.setName('systemchannel')
            .setDescription('Define el canal de mensajes del sistema (bienvenidas nativas de Discord, boosts)')
            .addChannelOption(o => o.setName('canal').setDescription('Canal del sistema').setRequired(true))),

    name: 'serversettings',
    aliases: ['ajustesservidor'],
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

        const validSubs = ['view', 'verificationlevel', 'explicitfilter', 'systemchannel'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/serversettings <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
