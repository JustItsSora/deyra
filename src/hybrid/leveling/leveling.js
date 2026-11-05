// src/hybrid/leveling/leveling.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('level')
        .setDescription('Sistema de niveles y XP')
        .addSubcommand(s => s.setName('rank').setDescription('Muestra tu nivel o el de otro usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)))
        .addSubcommand(s => s.setName('leaderboard').setDescription('Muestra el top de niveles del servidor'))
        .addSubcommand(s => s.setName('toggle').setDescription('[Admin] Activa o desactiva el sistema de niveles')
            .addBooleanOption(o => o.setName('activo').setDescription('true/false').setRequired(true)))
        .addSubcommand(s => s.setName('setchannel').setDescription('[Admin] Canal donde se anuncian los level-ups')
            .addChannelOption(o => o.setName('canal').setDescription('Canal (vacío = mismo canal del mensaje)').setRequired(false)))
        .addSubcommand(s => s.setName('setxp').setDescription('[Admin] Define el rango de XP por mensaje')
            .addIntegerOption(o => o.setName('min').setDescription('XP mínimo').setMinValue(1).setRequired(true))
            .addIntegerOption(o => o.setName('max').setDescription('XP máximo').setMinValue(1).setRequired(true)))
        .addSubcommand(s => s.setName('addrolereward').setDescription('[Admin] Otorga un rol automáticamente al alcanzar un nivel')
            .addIntegerOption(o => o.setName('nivel').setDescription('Nivel requerido').setMinValue(1).setRequired(true))
            .addRoleOption(o => o.setName('rol').setDescription('Rol a otorgar').setRequired(true)))
        .addSubcommand(s => s.setName('removerolereward').setDescription('[Admin] Quita una recompensa de rol por nivel')
            .addIntegerOption(o => o.setName('nivel').setDescription('Nivel').setMinValue(1).setRequired(true)))
        .addSubcommand(s => s.setName('resetxp').setDescription('[Admin] Reinicia el XP de un usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))),

    name: 'level',
    aliases: ['rank', 'xp'],
    category: 'niveles',

    async execute(interactionOrMessage, args = []) {
        const isSlash = interactionOrMessage.isCommand?.();
        let subcommand;

        if (isSlash) {
            subcommand = interactionOrMessage.options.getSubcommand();
        } else {
            subcommand = args[0]?.toLowerCase() || 'rank';
            args = args.slice(1);
        }

        const validSubs = ['rank', 'leaderboard', 'toggle', 'setchannel', 'setxp', 'addrolereward', 'removerolereward', 'resetxp'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/level <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
