// src/gateway/welcome/welcomeEvents.js
const { WelcomeConfig, AutoRole } = require('../../data/models');
const { infoPanel, errorPanel } = require('../../lib/panel');
const { fillPlaceholders } = require('../../lib/placeholders');

function init(client) {
    client.on('guildMemberAdd', async (member) => {
        try {
            await handleJoin(member);
        } catch (err) {
            console.error('[welcome] Error en guildMemberAdd:', err);
        }
    });

    client.on('guildMemberRemove', async (member) => {
        try {
            await handleLeave(member);
        } catch (err) {
            console.error('[welcome] Error en guildMemberRemove:', err);
        }
    });
}

async function handleJoin(member) {
    // Autorole
    const autoRole = await AutoRole.findOne({ where: { guildId: member.guild.id } });
    if (autoRole) {
        const roleIds = JSON.parse(member.user.bot ? autoRole.botRoleIds : autoRole.roleIds || '[]');
        for (const roleId of roleIds) {
            await member.roles.add(roleId).catch(() => {});
        }
    }

    // Mensaje de bienvenida
    const config = await WelcomeConfig.findOne({ where: { guildId: member.guild.id } });
    if (!config?.welcomeEnabled || !config.welcomeChannelId) return;

    const channel = await member.guild.channels.fetch(config.welcomeChannelId).catch(() => null);
    if (!channel) return;

    const text = fillPlaceholders(config.welcomeMessage || '¡Bienvenido/a {user} a {server}!', { member, guild: member.guild });
    await channel.send({ content: `${member}`, ...infoPanel('👋 ¡Nuevo miembro!', text) }).catch(() => {});
}

async function handleLeave(member) {
    const config = await WelcomeConfig.findOne({ where: { guildId: member.guild.id } });
    if (!config?.leaveEnabled || !config.leaveChannelId) return;

    const channel = await member.guild.channels.fetch(config.leaveChannelId).catch(() => null);
    if (!channel) return;

    const text = fillPlaceholders(config.leaveMessage || '{user} ha dejado el servidor.', { member, guild: member.guild });
    await channel.send({ ...errorPanel('👋 Miembro perdido', text) }).catch(() => {});
}

module.exports = { init };
