// src/lib/interactionCount.js
const { InteractionCount } = require('../data/models');

/** Incrementa en 1 el contador de `action` de `fromUserId` hacia `toUserId`, y lo devuelve. */
async function incrementInteraction(guildId, fromUserId, toUserId, action) {
    const [record] = await InteractionCount.findOrCreate({
        where: { guildId, fromUserId, toUserId, action },
        defaults: { guildId, fromUserId, toUserId, action, count: 0 },
    });
    record.count += 1;
    await record.save();
    return record.count;
}

/** Lee (sin incrementar) el contador actual. */
async function getInteractionCount(guildId, fromUserId, toUserId, action) {
    const record = await InteractionCount.findOne({ where: { guildId, fromUserId, toUserId, action } });
    return record?.count || 0;
}

module.exports = { incrementInteraction, getInteractionCount };
