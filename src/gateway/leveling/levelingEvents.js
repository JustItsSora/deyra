// src/gateway/leveling/levelingEvents.js
const { Leveling, LevelConfig } = require('../../data/models');
const { xpForLevel } = require('../../lib/economyUtils');
const { infoPanel } = require('../../lib/panel');

function init(client) {
    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.guild) return;
        try {
            await trackXp(message, client);
        } catch (err) {
            console.error('[leveling] Error registrando XP:', err);
        }
    });
}

async function trackXp(message, client) {
    const config = await LevelConfig.findOne({ where: { guildId: message.guild.id } });
    if (config && !config.enabled) return;

    const ignoredChannels = config ? JSON.parse(config.ignoredChannels || '[]') : [];
    if (ignoredChannels.includes(message.channel.id)) return;

    const [record] = await Leveling.findOrCreate({
        where: { guildId: message.guild.id, userId: message.author.id },
        defaults: { guildId: message.guild.id, userId: message.author.id },
    });

    const cooldownSeconds = config?.xpCooldownSeconds ?? 60;
    if (record.lastMessageAt) {
        const elapsed = (Date.now() - record.lastMessageAt.getTime()) / 1000;
        if (elapsed < cooldownSeconds) {
            record.totalMessages += 1;
            await record.save();
            return;
        }
    }

    const min = config?.xpPerMessageMin ?? 15;
    const max = config?.xpPerMessageMax ?? 25;
    const gained = Math.floor(Math.random() * (max - min + 1)) + min;

    const previousLevel = record.level;
    record.xp = Number(record.xp) + gained;
    record.totalMessages += 1;
    record.lastMessageAt = new Date();

    // Recalcula nivel a partir del XP dentro del nivel actual (curva progresiva).
    let remaining = Number(record.xp);
    let level = 0;
    while (remaining >= xpForLevel(level)) {
        remaining -= xpForLevel(level);
        level++;
    }
    record.level = level;
    await record.save();

    if (level > previousLevel) {
        await announceLevelUp(message, config, level);
        await applyRoleReward(message, config, level);
    }
}

async function announceLevelUp(message, config, level) {
    if (config && !config.announceLevelUp) return;

    const channel = config?.announceChannelId
        ? await message.guild.channels.fetch(config.announceChannelId).catch(() => null)
        : message.channel;
    if (!channel) return;

    await channel.send({
        content: `${message.author}`,
        ...infoPanel('🎉 ¡Subiste de nivel!', `Ahora eres nivel **${level}**.`),
    }).catch(() => {});
}

async function applyRoleReward(message, config, level) {
    if (!config) return;
    const rewards = JSON.parse(config.roleRewards || '{}');
    const roleId = rewards[String(level)];
    if (!roleId) return;

    const member = message.member;
    if (member && !member.roles.cache.has(roleId)) {
        await member.roles.add(roleId).catch(() => {});
    }
}

module.exports = { init };
