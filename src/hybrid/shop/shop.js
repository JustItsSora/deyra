// src/hybrid/shop/shop.js
const { SlashCommandBuilder, PermissionFlagsBits, MessageFlags } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shop')
        .setDescription('Tienda del servidor')
        .addSubcommand(s => s.setName('list').setDescription('Muestra los artículos disponibles'))
        .addSubcommand(s => s.setName('buy').setDescription('Compra un artículo')
            .addStringOption(o => o.setName('id').setDescription('ID del artículo').setRequired(true)))
        .addSubcommand(s => s.setName('inventory').setDescription('Muestra tu inventario')
            .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)))
        .addSubcommand(s => s.setName('additem').setDescription('[Admin] Añade un artículo a la tienda')
            .addStringOption(o => o.setName('id').setDescription('ID único del artículo (slug)').setRequired(true))
            .addStringOption(o => o.setName('nombre').setDescription('Nombre visible').setRequired(true))
            .addIntegerOption(o => o.setName('precio').setDescription('Precio').setMinValue(1).setRequired(true))
            .addStringOption(o => o.setName('descripcion').setDescription('Descripción').setRequired(false))
            .addRoleOption(o => o.setName('rol').setDescription('Rol que otorga al comprarlo').setRequired(false))
            .addIntegerOption(o => o.setName('stock').setDescription('Stock disponible (-1 = ilimitado)').setRequired(false)))
        .addSubcommand(s => s.setName('removeitem').setDescription('[Admin] Quita un artículo de la tienda')
            .addStringOption(o => o.setName('id').setDescription('ID del artículo').setRequired(true)))
        .addSubcommand(s => s.setName('edititem').setDescription('[Admin] Edita el precio de un artículo existente')
            .addStringOption(o => o.setName('id').setDescription('ID del artículo').setRequired(true))
            .addIntegerOption(o => o.setName('precio').setDescription('Nuevo precio').setMinValue(1).setRequired(true))),

    name: 'shop',
    aliases: ['tienda'],
    category: 'economía',
    defaultMemberPermissions: PermissionFlagsBits.SendMessages,

    async execute(interactionOrMessage, args = []) {
        const isSlash = interactionOrMessage.isCommand?.();
        let subcommand;

        if (isSlash) {
            subcommand = interactionOrMessage.options.getSubcommand();
        } else {
            subcommand = args[0]?.toLowerCase();
            args = args.slice(1);
        }

        const validSubs = ['list', 'buy', 'inventory', 'additem', 'removeitem', 'edititem'];
        if (!subcommand || !validSubs.includes(subcommand)) {
            const usage = `Uso: \`/shop <${validSubs.join('|')}>\``;
            return isSlash
                ? interactionOrMessage.reply({ content: usage, flags: MessageFlags.Ephemeral})
                : interactionOrMessage.reply(usage);
        }

        const subcommandFile = require(`./subcommands/${subcommand}`);
        return subcommandFile.execute(interactionOrMessage, args);
    },
};
