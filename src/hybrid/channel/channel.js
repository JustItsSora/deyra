// src/hybrid/channel/channel.js
const { SlashCommandBuilder, PermissionFlagsBits, ChannelType, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('channel')
        .setDescription('Gestiona canales del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
        .addSubcommand(s => s.setName('create')
            .setDescription('Crea un canal de texto nuevo')
            .addStringOption(o => o.setName('nombre').setDescription('Nombre del canal').setRequired(true))
            .addChannelOption(o => o.setName('categoria').setDescription('Categoría donde crearlo').setRequired(false)))
        .addSubcommand(s => s.setName('delete')
            .setDescription('Elimina un canal')
            .addChannelOption(o => o.setName('canal').setDescription('Canal a eliminar').setRequired(true)))
        .addSubcommand(s => s.setName('topic')
            .setDescription('Cambia el tema de este canal')
            .addStringOption(o => o.setName('texto').setDescription('Nuevo tema').setRequired(true)))
        .addSubcommand(s => s.setName('nsfw')
            .setDescription('Marca o desmarca este canal como NSFW')
            .addBooleanOption(o => o.setName('activo').setDescription('true/false').setRequired(true)))
        .addSubcommand(s => s.setName('rename')
            .setDescription('Renombra este canal')
            .addStringOption(o => o.setName('nuevo_nombre').setDescription('Nuevo nombre').setRequired(true))),

    name: 'channel',
    aliases: ['canal'],
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

        const validSubs = ['create', 'delete', 'topic', 'nsfw', 'rename'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/channel <${validSubs.join('|')}>\` (recomendado usar como slash command)`;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
