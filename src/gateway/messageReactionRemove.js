const { ReactionRole } = require('../data/models');

module.exports = {
    name: 'messageReactionRemove',
    async execute(reaction, user) {
        if (user.bot) return;
        try {
            if (reaction.partial) await reaction.fetch().catch(() => null);
            if (!reaction.message.guild) return;

            const record = await ReactionRole.findOne({ where: { messageId: reaction.message.id } });
            if (!record) return;
            if (record.mode === 'unique') return; // en modo unique, quitar la reacción no quita el rol

            const mapping = JSON.parse(record.mapping || '{}');
            const emojiKey = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
            const roleId = mapping[emojiKey] || mapping[reaction.emoji.name];
            if (!roleId) return;

            const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
            if (!member) return;

            await member.roles.remove(roleId).catch(() => {});
        } catch (err) {
            console.error('[reactionRoles] Error en messageReactionRemove:', err);
        }
    },
};
