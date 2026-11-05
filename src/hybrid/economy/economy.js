// src/hybrid/economy/economy.js
const { SlashCommandBuilder, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('Comandos de economía')
        .addSubcommand(s => s.setName('balance').setDescription('Muestra tu saldo o el de otro usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)))
        .addSubcommand(s => s.setName('daily').setDescription('Reclama tu recompensa diaria'))
        .addSubcommand(s => s.setName('weekly').setDescription('Reclama tu recompensa semanal'))
        .addSubcommand(s => s.setName('work').setDescription('Trabaja para ganar dinero'))
        .addSubcommand(s => s.setName('crime').setDescription('Comete un crimen (arriesgado, mayor recompensa)'))
        .addSubcommand(s => s.setName('beg').setDescription('Pide limosna (poca recompensa, sin riesgo)'))
        .addSubcommand(s => s.setName('rob').setDescription('Intenta robarle a otro usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario objetivo').setRequired(true)))
        .addSubcommand(s => s.setName('deposit').setDescription('Deposita dinero en el banco')
            .addStringOption(o => o.setName('cantidad').setDescription('Cantidad, o "all" para depositar todo').setRequired(true)))
        .addSubcommand(s => s.setName('withdraw').setDescription('Retira dinero del banco')
            .addStringOption(o => o.setName('cantidad').setDescription('Cantidad, o "all" para retirar todo').setRequired(true)))
        .addSubcommand(s => s.setName('pay').setDescription('Transfiere dinero a otro usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Destinatario').setRequired(true))
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a transferir').setMinValue(1).setRequired(true)))
        .addSubcommand(s => s.setName('coinflip').setDescription('Apuesta cara o cruz')
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a apostar').setMinValue(1).setRequired(true))
            .addStringOption(o => o.setName('eleccion').setDescription('Cara o cruz').setRequired(true).addChoices({ name: 'Cara', value: 'heads' }, { name: 'Cruz', value: 'tails' })))
        .addSubcommand(s => s.setName('slots').setDescription('Juega a la tragamonedas')
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad a apostar').setMinValue(1).setRequired(true)))
        .addSubcommand(s => s.setName('give').setDescription('[Admin] Otorga dinero a un usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true)))
        .addSubcommand(s => s.setName('take').setDescription('[Admin] Quita dinero a un usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario').setRequired(true))
            .addIntegerOption(o => o.setName('cantidad').setDescription('Cantidad').setRequired(true)))
        .addSubcommand(s => s.setName('leaderboard').setDescription('Muestra el top de usuarios más ricos (alias de /richest)'))
        .addSubcommand(s => s.setName('bankupgrade').setDescription('Mejora la capacidad de tu banco (cuesta dinero)'))
        .addSubcommand(s => s.setName('gift').setDescription('Regala un ítem de tu inventario a otro usuario')
            .addUserOption(o => o.setName('usuario').setDescription('Destinatario').setRequired(true))
            .addStringOption(o => o.setName('item_id').setDescription('ID del ítem a regalar').setRequired(true))),

    name: 'economy',
    aliases: ['eco'],
    category: 'economía',

    async execute(interactionOrMessage, args = []) {
        const isSlash = interactionOrMessage.isCommand?.();
        let subcommand;

        if (isSlash) {
            subcommand = interactionOrMessage.options.getSubcommand();
        } else {
            subcommand = args[0]?.toLowerCase();
            args = args.slice(1);
        }

        const aliasMap = { bal: 'balance', d: 'daily', w: 'work', gib: 'give' };
        subcommand = aliasMap[subcommand] || subcommand;

        const validSubs = ['balance', 'daily', 'weekly', 'work', 'crime', 'beg', 'rob', 'deposit', 'withdraw', 'pay', 'coinflip', 'slots', 'give', 'take', 'leaderboard', 'bankupgrade', 'gift'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/economy <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
