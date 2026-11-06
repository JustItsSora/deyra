// src/hybrid/honeypot/honeypot.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('honeypot')
        .setDescription('Configura el canal señuelo contra bots de spam y raiders')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
        .addSubcommand(s => s.setName('setup')
            .setDescription('Crea el canal señuelo y activa la trampa')
            .addStringOption(o => o.setName('nombre').setDescription('Nombre del canal (por defecto: free-gifts)').setRequired(false))
            .addStringOption(o => o.setName('accion').setDescription('Qué hacer con quien caiga (por defecto: kick)').setRequired(false)
                .addChoices(
                    { name: 'Silenciar (timeout)', value: 'timeout' },
                    { name: 'Expulsar (kick)', value: 'kick' },
                    { name: 'Banear (ban)', value: 'ban' })))
        .addSubcommand(s => s.setName('channel')
            .setDescription('Usa un canal existente como señuelo')
            .addChannelOption(o => o.setName('canal').setDescription('Canal a usar').setRequired(true).addChannelTypes(ChannelType.GuildText)))
        .addSubcommand(s => s.setName('toggle')
            .setDescription('Activa o desactiva la trampa')
            .addBooleanOption(o => o.setName('activo').setDescription('true para activar, false para desactivar').setRequired(true)))
        .addSubcommand(s => s.setName('action')
            .setDescription('Define qué pasa con quien caiga en la trampa')
            .addStringOption(o => o.setName('accion').setDescription('Acción a tomar').setRequired(true)
                .addChoices(
                    { name: 'Silenciar (timeout)', value: 'timeout' },
                    { name: 'Expulsar (kick)', value: 'kick' },
                    { name: 'Banear (ban)', value: 'ban' }))
            .addIntegerOption(o => o.setName('timeout_minutos').setDescription('Minutos de silencio si la acción es timeout (default 1440)').setRequired(false)))
        .addSubcommand(s => s.setName('disable')
            .setDescription('Desactiva la trampa y borra la configuración'))
        .addSubcommand(s => s.setName('rotate')
            .setDescription('Rota automáticamente el nombre del canal señuelo cada N horas')
            .addIntegerOption(o => o.setName('horas').setDescription('0 desactiva la rotación; 1 a 168 horas').setRequired(true).setMinValue(0).setMaxValue(168)))
        .addSubcommand(s => s.setName('autopurge')
            .setDescription('Borra los mensajes recientes de quien cae en el señuelo')
            .addBooleanOption(o => o.setName('activo').setDescription('true para activar, false para desactivar').setRequired(true)))
        .addSubcommand(s => s.setName('stats')
            .setDescription('Muestra cuántas cuentas cayeron en la trampa'))
        .addSubcommand(s => s.setName('status')
            .setDescription('Muestra la configuración actual del señuelo')),

    name: 'honeypot',
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

        const validSubs = ['setup', 'channel', 'toggle', 'action', 'rotate', 'autopurge', 'disable', 'stats', 'status'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/honeypot <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral })
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
