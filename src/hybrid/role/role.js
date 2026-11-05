// src/hybrid/role/role.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('role')
        .setDescription('Gestiona roles del servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
        .addSubcommand(s => s.setName('create')
            .setDescription('Crea un rol nuevo')
            .addStringOption(o => o.setName('nombre').setDescription('Nombre del rol').setRequired(true))
            .addStringOption(o => o.setName('color').setDescription('Color en HEX, ej: #2B7FFF').setRequired(false))
            .addBooleanOption(o => o.setName('mostrar_separado').setDescription('Mostrar el rol por separado en la lista de miembros').setRequired(false)))
        .addSubcommand(s => s.setName('delete')
            .setDescription('Elimina un rol')
            .addRoleOption(o => o.setName('rol').setDescription('Rol a eliminar').setRequired(true)))
        .addSubcommand(s => s.setName('color')
            .setDescription('Cambia el color de un rol')
            .addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(true))
            .addStringOption(o => o.setName('color').setDescription('Color en HEX, ej: #2B7FFF').setRequired(true)))
        .addSubcommand(s => s.setName('rename')
            .setDescription('Renombra un rol')
            .addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(true))
            .addStringOption(o => o.setName('nuevo_nombre').setDescription('Nuevo nombre').setRequired(true)))
        .addSubcommand(s => s.setName('mentionable')
            .setDescription('Cambia si un rol es mencionable')
            .addRoleOption(o => o.setName('rol').setDescription('Rol').setRequired(true))
            .addBooleanOption(o => o.setName('activo').setDescription('true/false').setRequired(true))),

    name: 'role',
    aliases: ['rol'],
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

        const validSubs = ['create', 'delete', 'color', 'rename', 'mentionable'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/role <${validSubs.join('|')}>\` (recomendado usar como slash command)`;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
