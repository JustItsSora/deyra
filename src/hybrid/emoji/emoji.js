// src/hybrid/emoji/emoji.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emoji')
        .setDescription('Gestiona emojis personalizados del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageEmojisAndStickers)
        .addSubcommand(s => s.setName('add')
            .setDescription('Añade un emoji al servidor desde una URL')
            .addStringOption(o => o.setName('url').setDescription('URL de la imagen').setRequired(true))
            .addStringOption(o => o.setName('nombre').setDescription('Nombre del emoji').setRequired(true)))
        .addSubcommand(s => s.setName('remove')
            .setDescription('Elimina un emoji del servidor')
            .addStringOption(o => o.setName('nombre').setDescription('Nombre del emoji a eliminar').setRequired(true)))
        .addSubcommand(s => s.setName('rename')
            .setDescription('Renombra un emoji del servidor')
            .addStringOption(o => o.setName('nombre_actual').setDescription('Nombre actual').setRequired(true))
            .addStringOption(o => o.setName('nuevo_nombre').setDescription('Nuevo nombre').setRequired(true))),

    name: 'emoji',
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

        const validSubs = ['add', 'remove', 'rename'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/emoji <${validSubs.join('|')}>\` (recomendado usar como slash command)`;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
