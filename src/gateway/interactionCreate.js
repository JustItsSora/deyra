// src/gateway/interactionCreate.js
// Dispatcher central: slash commands, autocomplete, y componentes persistentes
// (botones/selects/modals) enrutados por prefijo de customId a los handlers
// registrados en gateway/interactions/.

const cooldown = require('../lib/cooldown');
const config = require('../config');
const { errorPanel } = require('../lib/panel');
const { suggest } = require('../lib/commandSuggest');
const { errorReport } = require('../lib/errorReport');
const { Blacklist } = require('../data/models');
const { MessageFlags } = require('discord.js');

module.exports = {
    name: 'interactionCreate',
    async execute(interaction, client) {
        try {
            if (interaction.isChatInputCommand()) {
                return handleSlashCommand(interaction, client);
            }

            if (interaction.isAutocomplete()) {
                return handleAutocomplete(interaction, client);
            }

            if (interaction.isButton() || interaction.isAnySelectMenu() || interaction.isModalSubmit()) {
                return handleComponent(interaction, client);
            }
        } catch (err) {
            console.error('[interactionCreate] Error no capturado:', err);
        }
    },
};

async function handleSlashCommand(interaction, client) {
    const command = client.commands.get(interaction.commandName);

    if (!command) {
        // Pasa cuando el comando se desregistró de la API pero el cliente del
        // usuario todavía lo tiene cacheado en la lista de "/", o cuando la
        // app tiene más de 100 slash y este no entró en el registro. Antes
        // esto era un silencio: el usuario pretaba Enter y no pasaba nada.
        const sugerencias = suggest(interaction.commandName, client.commands.keys());

        return interaction.reply({
            ...errorPanel({
                category: 'utilidad',
                title: `El comando \`/${interaction.commandName}\` ya no está disponible`,
                kicker: 'Comando desactualizado',
                icon: '🔄',
                description: sugerencias.length
                    ? `Quizá querías usar ${sugerencias.map(s => `\`/${s}\``).join(', ')}.`
                    : 'Se desregistró de Discord, pero tu cliente todavía lo muestra en la lista. Recargá la app o escribí `/` de nuevo para actualizar la lista.',
                callouts: [{
                    tone: 'muted',
                    text: 'Discord tarda hasta 1 hora en propagar los cambios de slash commands. Si lo usaste hace poco, esperá un rato.',
                }],
            }),
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
        }).catch(() => {});
    }

    const blacklisted = await Blacklist.findOne({ where: { userId: interaction.user.id } }).catch(() => null);
    if (blacklisted) {
        return interaction.reply({ content: 'No puedes usar este bot. Has sido bloqueado por el equipo del bot.', flags: MessageFlags.Ephemeral}).catch(() => {});
    }

    const userId = interaction.user.id;
    const remaining = cooldown.check(command.data.name, userId, command.cooldownMs || config.DEFAULT_COOLDOWN_MS);
    if (remaining > 0) {
        return interaction.reply({
            content: `Espera ${(remaining / 1000).toFixed(1)}s antes de volver a usar este comando.`,
            flags: MessageFlags.Ephemeral,
        }).catch(() => {});
    }

    try {
        await command.execute(interaction, []);
    } catch (err) {
        console.error(`[interactionCreate] Error ejecutando /${interaction.commandName}:`, err);
        const payload = { ...errorPanel(errorReport('Error', err, `/${interaction.commandName}`)), flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral };
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(payload).catch(() => {});
        } else {
            await interaction.reply(payload).catch(() => {});
        }
    }
}

async function handleAutocomplete(interaction, client) {
    const command = client.commands.get(interaction.commandName);
    if (!command || typeof command.autocomplete !== 'function') return;
    try {
        await command.autocomplete(interaction);
    } catch (err) {
        console.error(`[interactionCreate] Error en autocomplete de /${interaction.commandName}:`, err);
    }
}

async function handleComponent(interaction, client) {
    const customId = interaction.customId || '';
    const prefix = customId.split('_')[0];

    const handler = client.interactionHandlers?.get(prefix);
    if (!handler || typeof handler.handle !== 'function') return;

    try {
        await handler.handle(interaction);
    } catch (err) {
        console.error(`[interactionCreate] Error en handler "${prefix}" para customId "${customId}":`, err);
        const payload = { content: 'Algo salió mal procesando esta interacción.', flags: MessageFlags.Ephemeral };
        if (interaction.replied || interaction.deferred) {
            await interaction.editReply(payload).catch(() => {});
        } else {
            await interaction.reply(payload).catch(() => {});
        }
    }
}
