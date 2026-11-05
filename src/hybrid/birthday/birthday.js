// src/hybrid/birthday/birthday.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('birthday')
        .setDescription('Gestiona cumpleaños')
        .addSubcommand(s => s.setName('set').setDescription('Configura tu fecha de cumpleaños')
            .addIntegerOption(o => o.setName('dia').setDescription('Día (1-31)').setMinValue(1).setMaxValue(31).setRequired(true))
            .addIntegerOption(o => o.setName('mes').setDescription('Mes (1-12)').setMinValue(1).setMaxValue(12).setRequired(true)))
        .addSubcommand(s => s.setName('remove').setDescription('Elimina tu cumpleaños registrado'))
        .addSubcommand(s => s.setName('list').setDescription('Muestra los próximos cumpleaños del servidor'))
        .addSubcommand(s => s.setName('setchannel').setDescription('[Admin] Canal donde se anuncian los cumpleaños')
            .addChannelOption(o => o.setName('canal').setDescription('Canal').setRequired(true))),

    name: 'birthday',
    aliases: ['cumpleanos'],
    category: 'utilidad',

    async execute(interactionOrMessage, args = []) {
        const isSlash = interactionOrMessage.isCommand?.();
        let subcommand;

        if (isSlash) {
            subcommand = interactionOrMessage.options.getSubcommand();
        } else {
            subcommand = args[0]?.toLowerCase() || 'list';
            args = args.slice(1);
        }

        const validSubs = ['set', 'remove', 'list', 'setchannel'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/birthday <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
