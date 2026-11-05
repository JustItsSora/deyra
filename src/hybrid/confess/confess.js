// src/hybrid/confess/confess.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('confess')
        .setDescription('Envía una confesión anónima')
        .addSubcommand(s => s.setName('send').setDescription('Envía tu confesión de forma anónima')
            .addStringOption(o => o.setName('mensaje').setDescription('Tu confesión').setRequired(true)))
        .addSubcommand(s => s.setName('setchannel').setDescription('[Admin] Canal donde se publican las confesiones')
            .addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true))),

    name: 'confess',
    aliases: ['confesar'],
    category: 'utilidad',

    async execute(interactionOrMessage, args = []) {
        const isSlash = interactionOrMessage.isCommand?.();
        let subcommand;

        if (isSlash) {
            subcommand = interactionOrMessage.options.getSubcommand();
        } else {
            subcommand = args[0]?.toLowerCase() === 'setchannel' ? 'setchannel' : 'send';
            args = subcommand === 'send' ? args : args.slice(1);
        }

        const validSubs = ['send', 'setchannel'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/confess <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
