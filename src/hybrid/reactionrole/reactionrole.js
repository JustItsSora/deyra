// src/hybrid/reactionrole/reactionrole.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reactionrole')
        .setDescription('Configura roles por reacción')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(s => s.setName('create').setDescription('Crea un panel de roles por reacción')
            .addChannelOption(o => o.setName('canal').setDescription('Canal donde publicar el panel').setRequired(true))
            .addStringOption(o => o.setName('titulo').setDescription('Título del panel').setRequired(true))
            .addStringOption(o => o.setName('descripcion').setDescription('Descripción del panel').setRequired(false)))
        .addSubcommand(s => s.setName('addrole').setDescription('Añade un emoji-rol a un panel existente')
            .addStringOption(o => o.setName('message_id').setDescription('ID del mensaje del panel').setRequired(true))
            .addStringOption(o => o.setName('emoji').setDescription('Emoji a usar').setRequired(true))
            .addRoleOption(o => o.setName('rol').setDescription('Rol a otorgar').setRequired(true))),

    name: 'reactionrole',
    aliases: ['rr'],
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

        const validSubs = ['create', 'addrole'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/reactionrole <${validSubs.join('|')}>\` (solo disponible como slash command)`;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
