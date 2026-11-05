// src/hybrid/giveaway/giveaway.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('giveaway')
        .setDescription('Gestiona sorteos')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addSubcommand(s => s.setName('start').setDescription('Inicia un sorteo')
            .addStringOption(o => o.setName('duracion').setDescription('Ej: 10m, 1h, 2d').setRequired(true))
            .addStringOption(o => o.setName('premio').setDescription('Qué se sortea').setRequired(true))
            .addIntegerOption(o => o.setName('ganadores').setDescription('Número de ganadores').setMinValue(1).setRequired(false))
            .addRoleOption(o => o.setName('rol_requerido').setDescription('Rol requerido para participar').setRequired(false)))
        .addSubcommand(s => s.setName('end').setDescription('Finaliza un sorteo antes de tiempo')
            .addStringOption(o => o.setName('message_id').setDescription('ID del mensaje del sorteo').setRequired(true)))
        .addSubcommand(s => s.setName('reroll').setDescription('Vuelve a sortear ganador(es) de un sorteo finalizado')
            .addStringOption(o => o.setName('message_id').setDescription('ID del mensaje del sorteo').setRequired(true))),

    name: 'giveaway',
    aliases: ['gw', 'sorteo'],
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

        const validSubs = ['start', 'end', 'reroll'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/giveaway <${validSubs.join('|')}>\` (solo disponible como slash command)`;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
