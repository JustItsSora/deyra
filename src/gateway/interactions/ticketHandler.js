// src/gateway/interactions/ticketHandler.js
// Maneja los botones persistentes del sistema de tickets: crear, reclamar, cerrar.
// customId prefix: "ticket_" -> enrutado aquí desde interactionCreate.js.

const { PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { Ticket, TicketConfig } = require('../../data/models');
const { createTicketChannel } = require('../../lib/ticketUtils');
const { successPanel, errorPanel, buildPanel } = require('../../lib/panel');
const { emoji } = require('../../lib/emojis');
const { hasPermission } = require('../../lib/permissions');

module.exports = {
    async handle(interaction) {
        const id = interaction.customId;

        if (id === 'ticket_create') return handleCreate(interaction);
        if (id === 'ticket_claim') return handleClaim(interaction);
        if (id === 'ticket_close') return handleClose(interaction);
        if (id === 'ticket_confirm_close') return handleConfirmClose(interaction);
        if (id === 'ticket_cancel_close') return interaction.update({ content: 'Cierre cancelado.', components: [] }).catch(() => {});
    },
};

async function handleCreate(interaction) {
    await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    const result = await createTicketChannel(interaction.guild, interaction.member);

    if (result.error === 'not_configured') {
        return interaction.editReply({ ...errorPanel('No configurado', 'El sistema de tickets no está configurado en este servidor.') });
    }
    if (result.error === 'already_open') {
        return interaction.editReply({ ...errorPanel('Ya tienes un ticket abierto', `Ya tienes un ticket abierto: ${result.channel}`) });
    }
    if (result.error === 'category_missing') {
        return interaction.editReply({ ...errorPanel('Categoría borrada', 'La categoría de tickets ya no existe. Volvé a configurar el sistema con `/ticket setup`.') });
    }
    if (result.error === 'missing_permissions') {
        const faltan = (result.missing || ['ManageChannels']).join(', ');
        return interaction.editReply({
            ...errorPanel(
                'Me falta un permiso',
                `No puedo crear el ticket porque no tengo el permiso **${faltan}** en la categoría de tickets.`,
            ),
        });
    }
    if (result.error === 'create_failed') {
        return interaction.editReply({ ...errorPanel('Error', 'No pude crear el canal del ticket. Revisa mis permisos.') });
    }

    return interaction.editReply({ ...successPanel('Ticket creado', `Tu ticket fue creado: ${result.channel}`) });
}

async function handleClaim(interaction) {
    const ticket = await Ticket.findOne({ where: { channelId: interaction.channel.id } });
    if (!ticket) return interaction.reply({ content: 'Este canal no es un ticket registrado.', flags: MessageFlags.Ephemeral}).catch(() => {});

    if (!hasPermission(interaction.member, PermissionsBitField.Flags.ManageChannels)) {
        const config = await TicketConfig.findOne({ where: { guildId: interaction.guild.id } });
        const supportRoleIds = JSON.parse(config?.supportRoleIds || '[]');
        const isSupport = interaction.member.roles.cache.some(r => supportRoleIds.includes(r.id));
        if (!isSupport) {
            return interaction.reply({ content: 'Solo el equipo de soporte puede reclamar tickets.', flags: MessageFlags.Ephemeral}).catch(() => {});
        }
    }

    if (ticket.status === 'claimed') {
        return interaction.reply({ content: `Este ticket ya fue reclamado por <@${ticket.claimedBy}>.`, flags: MessageFlags.Ephemeral}).catch(() => {});
    }

    ticket.status = 'claimed';
    ticket.claimedBy = interaction.user.id;
    await ticket.save();

    return interaction.reply({ ...successPanel('Ticket reclamado', `${interaction.user} se ha asignado este ticket.`) }).catch(() => {});
}

async function handleClose(interaction) {
    const row = new ActionRowBuilder().addComponents(
        new ButtonBuilder().setCustomId('ticket_confirm_close').setLabel('Confirmar cierre').setStyle(ButtonStyle.Danger),
        new ButtonBuilder().setCustomId('ticket_cancel_close').setLabel('Cancelar').setStyle(ButtonStyle.Secondary),
    );
    const panel = buildPanel({ title: `${emoji('WARNING')} ¿Cerrar este ticket?`, description: 'Esta acción archivará el canal. Confirma para continuar.', tone: 'warning', rows: [row] });
    return interaction.reply({ components: [panel], flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral}).catch(() => {});
}

async function handleConfirmClose(interaction) {
    const ticket = await Ticket.findOne({ where: { channelId: interaction.channel.id } });
    if (!ticket) return interaction.update({ content: 'Este canal no es un ticket registrado.', components: [] }).catch(() => {});

    ticket.status = 'closed';
    ticket.closedBy = interaction.user.id;
    ticket.closedAt = new Date();
    await ticket.save();

    await interaction.update({ content: 'Cerrando ticket...', components: [] }).catch(() => {});

    const config = await TicketConfig.findOne({ where: { guildId: interaction.guild.id } });
    if (config?.logChannelId) {
        const logChannel = await interaction.guild.channels.fetch(config.logChannelId).catch(() => null);
        if (logChannel) {
            await logChannel.send({
                ...buildPanelPayload(`Ticket #${ticket.ticketNumber} cerrado`, `**Usuario:** <@${ticket.userId}>\n**Cerrado por:** ${interaction.user}\n**Canal:** ${interaction.channel.name}`),
            }).catch(() => {});
        }
    }

    setTimeout(() => interaction.channel.delete().catch(() => {}), 5000);
}

function buildPanelPayload(title, description) {
    return { components: [buildPanel({ title, description, tone: 'neutral' })], flags: MessageFlags.IsComponentsV2 };
}
