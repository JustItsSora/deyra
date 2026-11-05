// src/lib/ticketUtils.js
const { PermissionsBitField, ChannelType, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { TicketConfig, Ticket } = require('../data/models');
const { buildPanel } = require('./panel');
const { emoji } = require('./emojis');
const { missingBotPermissions } = require('./permissions');

/**
 * Crea un canal de ticket para `member`, con permisos para el rol de soporte
 * y overwrite de nadie más. Devuelve el canal creado o null si falló.
 *
 * @returns {Promise<{channel?: import('discord.js').TextChannel, ticketNumber?: number,
 *   error?: 'not_configured'|'already_open'|'create_failed'|'missing_permissions'|'category_missing',
 *   missing?: string[], channel?: import('discord.js').TextChannel}>}
 */
async function createTicketChannel(guild, member) {
    const config = await TicketConfig.findOne({ where: { guildId: guild.id } });
    if (!config?.categoryId) return { error: 'not_configured' };

    // Evita tickets duplicados del mismo usuario.
    const existing = await Ticket.findOne({ where: { guildId: guild.id, userId: member.id, status: ['open', 'claimed'] } });
    if (existing) {
        const channel = await guild.channels.fetch(existing.channelId).catch(() => null);
        if (channel) return { error: 'already_open', channel };
    }

    // Crear un canal dentro de una categoría exige "Administrar canales" EN
    // ESA CATEGORÍA (los overwrites de la categoría pisan los del servidor).
    // Sin este chequeo, Discord responde 50013 y el usuario ve un error sin
    // explicación mientras el stack se va a la consola.
    const category = await guild.channels.fetch(config.categoryId).catch(() => null);
    if (!category) return { error: 'category_missing' };

    const missing = await missingBotPermissions(guild, category, [PermissionsBitField.Flags.ManageChannels]);
    if (missing.length) return { error: 'missing_permissions', missing };

    const supportRoleIds = JSON.parse(config.supportRoleIds || '[]');
    config.ticketCounter += 1;
    const ticketNumber = config.ticketCounter;
    await config.save();

    const overwrites = [
        { id: guild.roles.everyone.id, deny: [PermissionsBitField.Flags.ViewChannel] },
        { id: member.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] },
        { id: guild.members.me.id, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ManageChannels] },
        ...supportRoleIds.map(roleId => ({ id: roleId, allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory] })),
    ];

    let channel;
    try {
        channel = await guild.channels.create({
            name: `ticket-${ticketNumber}`,
            type: ChannelType.GuildText,
            parent: config.categoryId,
            permissionOverwrites: overwrites,
        });
    } catch (err) {
        // 50013 = Missing Permissions: se loguea corto (el stack entero acá
        // tapaba el resto de la consola) y el handler le explica al usuario.
        console.error(`[ticketUtils] Error creando canal: ${err.code || ''} ${err.message || err}`);
        return { error: 'create_failed', missing: err.code === 50013 ? ['ManageChannels'] : [] };
    }

    await Ticket.create({ guildId: guild.id, channelId: channel.id, userId: member.id, ticketNumber, status: 'open' });

    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_claim').setLabel('Reclamar').setStyle(ButtonStyle.Secondary).setEmoji('🙋'),
        new ButtonBuilder().setCustomId('ticket_close').setLabel('Cerrar').setStyle(ButtonStyle.Danger).setEmoji('🔒'),
    );

    const panel = buildPanel({
        title: `${emoji('SUPPORT')} Ticket #${ticketNumber}`,
        description: config.welcomeMessage || `Bienvenido/a ${member}, describe tu problema y el equipo de soporte te atenderá pronto.`,
        tone: 'primary',
        rows: [row],
    });

    await channel.send({ content: `${member} | ${supportRoleIds.map(id => `<@&${id}>`).join(' ')}`, components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

    return { channel, ticketNumber };
}

module.exports = { createTicketChannel };
