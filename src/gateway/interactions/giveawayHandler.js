// src/gateway/interactions/giveawayHandler.js
const { Giveaway } = require('../../data/models');
const { buildPanel } = require('../../lib/panel');
const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');

module.exports = {
    async handle(interaction) {
        const giveaway = await Giveaway.findOne({ where: { messageId: interaction.message.id } });
        if (!giveaway) {
            return interaction.reply({ content: 'Este sorteo ya no está disponible.', flags: MessageFlags.Ephemeral}).catch(() => {});
        }
        if (giveaway.ended) {
            return interaction.reply({ content: 'Este sorteo ya finalizó.', flags: MessageFlags.Ephemeral}).catch(() => {});
        }

        if (giveaway.requiredRoleId && !interaction.member.roles.cache.has(giveaway.requiredRoleId)) {
            return interaction.reply({ content: `Necesitas el rol <@&${giveaway.requiredRoleId}> para participar.`, flags: MessageFlags.Ephemeral}).catch(() => {});
        }

        const entrants = JSON.parse(giveaway.entrants || '[]');
        if (entrants.includes(interaction.user.id)) {
            return interaction.reply({ content: 'Ya estás participando en este sorteo.', flags: MessageFlags.Ephemeral}).catch(() => {});
        }

        entrants.push(interaction.user.id);
        giveaway.entrants = JSON.stringify(entrants);
        await giveaway.save();

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId('giveaway_enter').setLabel('Participar').setStyle(ButtonStyle.Primary).setEmoji('🎉'),
        );

        const description = `**Premio:** ${giveaway.prize}\n**Termina:** <t:${Math.floor(giveaway.endsAt.getTime() / 1000)}:R>\n**Ganador(es):** ${giveaway.winnerCount}${giveaway.requiredRoleId ? `\n**Rol requerido:** <@&${giveaway.requiredRoleId}>` : ''}\n\nParticipantes: **${entrants.length}**`;

        const panel = buildPanel({ title: '🎉 ¡Sorteo!', description, tone: 'primary', rows: [row] });
        await interaction.update({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

        return interaction.followUp({ content: '¡Estás participando en el sorteo!', flags: MessageFlags.Ephemeral}).catch(() => {});
    },
};
