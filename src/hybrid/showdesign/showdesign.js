// src/hybrid/showdesign/showdesign.js
// Muestra en un panel de ejemplo cómo se ve cada bloque del sistema de diseño.
// Es un comando de owner: sirve para revisar el tema después de tocarlo, sin
// tener que_triggerar 20 comandos distintos.
//
// Uso: /showdesign            → el menú
//      /showdesign bloque:meters

const {
    SlashCommandBuilder, StringSelectMenuBuilder, ActionRowBuilder,
    PermissionFlagsBits, MessageFlags, ComponentType,
} = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const config = require('../../config');
const showcase = require('../../lib/showcase');
const ui = require('../../lib/ui');

const DESCRIPTIONS = {
    info: 'Datos, cifras y grilla (serverinfo, userinfo, botinfo)',
    callouts: 'Los cinco tonos de aviso',
    meters: 'Los cuatro estilos de barra de progreso',
    image: 'Panel con imagen y créditos',
    lists: 'Listas y citas',
    social: 'Panel de acción social con contador',
    error: 'Panel de error',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('showdesign')
        .setDescription('[Owner] Muestra ejemplos de los paneles del bot')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(o => o
            .setName('bloque')
            .setDescription('Qué ejemplo ver')
            .setRequired(false)
            .addChoices(...showcase.listSamples().map(name => ({
                name: name.slice(0, 100),
                value: name,
                description: (DESCRIPTIONS[name] || '').slice(0, 100),
            })))),

    name: 'showdesign',
    aliases: ['design', 'paneles'],
    category: 'owner',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const userId = isSlash(ctx) ? ctx.user.id : ctx.author?.id;
        if (userId !== config.OWNER_ID) {
            return reply(ctx, ui.noPermission('Este comando es solo para el owner del bot.'));
        }

        const requested = isSlash(ctx) ? ctx.options.getString('bloque') : args[0];
        const names = showcase.listSamples();

        if (requested) {
            if (!names.includes(requested)) {
                return reply(ctx, ui.missingArgument(
                    'Bloque desconocido',
                    `No tengo una muestra llamada "${ui.truncate(requested, 30)}".`,
                    { usage: `Disponibles: ${names.join(', ')}` },
                ));
            }
            // Un panel con imagen es más pesado que los demás: va efímero para
            // no ensuciar el canal.
            return reply(ctx, { ...showcase.sample(requested), ephemeral: true });
        }

        const menu = new StringSelectMenuBuilder()
            .setCustomId('showdesign_pick')
            .setPlaceholder('🎨 Elegí un bloque para ver')
            .addOptions(names.map(name => ({
                label: name,
                value: name,
                description: (DESCRIPTIONS[name] || '').slice(0, 100),
            })));

        return reply(ctx, ui.payload({
            category: 'owner',
            kicker: 'Design system',
            title: 'Ejemplos de paneles',
            icon: '🎨',
            description: 'Elegí un bloque para ver cómo se ve con datos de ejemplo.',
            lists: [{ title: 'Bloques', items: names.map(n => `\`${n}\` — ${DESCRIPTIONS[n] || ''}`) }],
            grid: [['Versión', `discord.js ${require('discord.js').version}`], ['Owner', `<@${config.OWNER_ID}>`]],
            rows: [new ActionRowBuilder().addComponents(menu)],
        }));
    },

    /** El selector del menú de arriba. */
    async handleSelect(interaction) {
        if (interaction.user.id !== config.OWNER_ID) {
            return interaction.reply({ ...ui.noPermission('Solo el owner.'), flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral}).catch(() => {});
        }
        const name = interaction.values[0];
        if (!showcase.listSamples().includes(name)) return;

        return interaction.update({ ...showcase.sample(name), flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral }).catch(() => {});
    },
};

module.exports.handleSelectComponent = async (interaction) => {
    if (!interaction.isStringSelectMenu() || interaction.customId !== 'showdesign_pick') return false;
    await module.exports.handleSelect(interaction);
    return true;
};
