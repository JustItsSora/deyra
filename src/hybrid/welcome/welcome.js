// src/hybrid/welcome/welcome.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('welcome')
        .setDescription('Configura mensajes de bienvenida y despedida')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(s => s.setName('setup').setDescription('Configura el mensaje de bienvenida')
            .addChannelOption(o => o.setName('canal').setDescription('Canal de bienvenidas').setRequired(true))
            .addStringOption(o => o.setName('mensaje').setDescription('Usa {user}, {server}, {membercount}').setRequired(false)))
        .addSubcommand(s => s.setName('leavesetup').setDescription('Configura el mensaje de despedida')
            .addChannelOption(o => o.setName('canal').setDescription('Canal de despedidas').setRequired(true))
            .addStringOption(o => o.setName('mensaje').setDescription('Usa {user}, {server}, {membercount}').setRequired(false)))
        .addSubcommand(s => s.setName('toggle').setDescription('Activa o desactiva bienvenidas o despedidas')
            .addStringOption(o => o.setName('tipo').setDescription('welcome o leave').setRequired(true).addChoices({ name: 'Bienvenida', value: 'welcome' }, { name: 'Despedida', value: 'leave' }))
            .addBooleanOption(o => o.setName('activo').setDescription('true/false').setRequired(true)))
        .addSubcommand(s => s.setName('test').setDescription('Envía un mensaje de bienvenida de prueba')),

    name: 'welcome',
    aliases: [],
    category: 'configuración',

    async execute(interactionOrMessage, args = []) {
        const isSlash = interactionOrMessage.isCommand?.();
        let subcommand;

        if (isSlash) {
            subcommand = interactionOrMessage.options.getSubcommand();
        } else {
            subcommand = args[0]?.toLowerCase();
            args = args.slice(1);
        }

        const validSubs = ['setup', 'leavesetup', 'toggle', 'test'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/welcome <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
