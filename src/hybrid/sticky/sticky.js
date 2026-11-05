// src/hybrid/sticky/sticky.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('sticky')
        .setDescription('Gestiona mensajes fijos que se reenvían automáticamente')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addSubcommand(s => s.setName('set').setDescription('Fija un mensaje en este canal')
            .addStringOption(o => o.setName('mensaje').setDescription('Contenido del mensaje fijo').setRequired(true)))
        .addSubcommand(s => s.setName('remove').setDescription('Quita el mensaje fijo de este canal')),

    name: 'sticky',
    aliases: [],
    category: 'configuración',

    async execute(interactionOrMessage, args = []) {
        const isSlash = interactionOrMessage.isCommand?.();
        let subcommand;

        if (isSlash) {
            subcommand = interactionOrMessage.options.getSubcommand();
        } else {
            subcommand = args[0]?.toLowerCase() === 'remove' ? 'remove' : 'set';
            args = subcommand === 'set' ? args : args.slice(1);
        }

        const validSubs = ['set', 'remove'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/sticky <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
