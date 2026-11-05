// src/hybrid/antinuke/antinuke.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('antinuke')
        .setDescription('Anti-nuke: corta ráfagas de acciones destructivas en el audit log')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(s => s.setName('toggle')
            .setDescription('Activa o desactiva el anti-nuke')
            .addBooleanOption(o => o.setName('activo').setDescription('true para activar, false para desactivar').setRequired(true)))
        .addSubcommand(s => s.setName('action')
            .setDescription('Qué hacer cuando se detecta la ráfaga')
            .addStringOption(o => o.setName('accion').setDescription('Acción a tomar').setRequired(true)
                .addChoices(
                    { name: 'Banear al autor', value: 'ban' },
                    { name: 'Quitarle todos los roles', value: 'derank' },
                    { name: 'Solo registrar', value: 'log' })))
        .addSubcommand(s => s.setName('threshold')
            .setDescription('Cuántas acciones sospechosas disparan la protección')
            .addIntegerOption(o => o.setName('cantidad').setDescription('Número de acciones (1-20)').setRequired(true).setMinValue(1).setMaxValue(20)))
        .addSubcommand(s => s.setName('window')
            .setDescription('Ventana de tiempo para contar las acciones')
            .addIntegerOption(o => o.setName('minutos').setDescription('Minutos (1-120)').setRequired(true).setMinValue(1).setMaxValue(120)))
        .addSubcommand(s => s.setName('whitelist')
            .setDescription('Excluye un usuario o rol de la detección')
            .addStringOption(o => o.setName('tipo').setDescription('usuario o rol').setRequired(true).addChoices({ name: 'Usuario', value: 'user' }, { name: 'Rol', value: 'role' }))
            .addStringOption(o => o.setName('accion').setDescription('add o remove').setRequired(true).addChoices({ name: 'Añadir', value: 'add' }, { name: 'Quitar', value: 'remove' }))
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a excluir').setRequired(false))
            .addRoleOption(o => o.setName('rol').setDescription('Rol a excluir').setRequired(false)))
        .addSubcommand(s => s.setName('status')
            .setDescription('Muestra la configuración actual del anti-nuke')),

    name: 'antinuke',
    aliases: [],
    category: 'moderación',

    async execute(interactionOrMessage, args = []) {
        const isSlash = interactionOrMessage.isCommand?.();
        let subcommand;

        if (isSlash) {
            subcommand = interactionOrMessage.options.getSubcommand();
        } else {
            subcommand = args[0]?.toLowerCase();
            args = args.slice(1);
        }

        const validSubs = ['toggle', 'action', 'threshold', 'window', 'whitelist', 'status'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/antinuke <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral })
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
