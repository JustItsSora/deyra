// src/gateway/guildCreate.js
// Cuando Deyra se une a un servidor nuevo, manda un panel de bienvenida al
// primer canal de texto donde pueda escribir: selector de idioma + mini
// explicación de qué trae el bot. El idioma elegido se guarda en
// GuildConfig para que el resto del bot lo pueda usar más adelante.

const { PermissionsBitField, MessageFlags } = require('discord.js');
const { buildJoinWelcomePanel } = require('../lib/joinWelcomePanel');

function findGreetableChannel(guild) {
    const me = guild.members.me;
    if (!me) return null;

    // Preferimos el canal de sistema si el bot puede escribir ahí (suele
    // ser el que ya usan para avisos), y si no, el primer canal de texto
    // disponible en orden de posición.
    const canSend = (channel) => channel?.isTextBased?.()
        && channel.viewable
        && channel.permissionsFor(me)?.has([PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]);

    if (canSend(guild.systemChannel)) return guild.systemChannel;

    const candidates = guild.channels.cache
        .filter((ch) => ch.type === 0 && canSend(ch))
        .sort((a, b) => a.position - b.position);

    return candidates.first() || null;
}

module.exports = {
    name: 'guildCreate',
    async execute(guild, client) {
        try {
            const channel = findGreetableChannel(guild);
            if (!channel) return;

            // Idioma por defecto según el locale preferido del servidor si
            // Discord lo reporta y coincide con uno soportado; si no, español.
            const guildLocale = guild.preferredLocale || '';
            const defaultLang = guildLocale.startsWith('en') ? 'en-US'
                : guildLocale.startsWith('de') ? 'de'
                : guildLocale.startsWith('fr') ? 'fr'
                : guildLocale.startsWith('pt') ? 'pt-BR'
                : guildLocale.startsWith('ru') ? 'ru'
                : 'es';

            const container = buildJoinWelcomePanel(defaultLang);
            await channel.send({ components: [container], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

            // Guardamos el idioma "sugerido" inicial; el selector del panel
            // lo actualiza si el usuario elige otro.
            try {
                const { GuildConfig } = require('../data/models');
                const [row] = await GuildConfig.findOrCreate({ where: { guildId: guild.id }, defaults: { language: defaultLang } });
                if (row.language !== defaultLang && !row.changed('language')) {
                    row.language = defaultLang;
                    await row.save();
                }
            } catch (err) {
                console.error('[guildCreate] No se pudo guardar el idioma inicial:', err.message);
            }
        } catch (err) {
            console.error('[guildCreate] Error al enviar el panel de bienvenida:', err);
        }
    },
};
