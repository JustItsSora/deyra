// src/hybrid/autorole/autorole.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('autorole')
        .setDescription('Configura roles automáticos al unirse')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(s => s.setName('add').setDescription('Añade un rol automático para nuevos miembros')
            .addRoleOption(o => o.setName('rol').setDescription('Rol a otorgar').setRequired(true))
            .addBooleanOption(o => o.setName('solo_bots').setDescription('Si es true, solo se aplica a bots que se unan').setRequired(false)))
        .addSubcommand(s => s.setName('remove').setDescription('Quita un rol automático')
            .addRoleOption(o => o.setName('rol').setDescription('Rol a quitar').setRequired(true)))
        .addSubcommand(s => s.setName('list').setDescription('Lista los roles automáticos configurados')),

    name: 'autorole',
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

        const validSubs = ['add', 'remove', 'list'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/autorole <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
