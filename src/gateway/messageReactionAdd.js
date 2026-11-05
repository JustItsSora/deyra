const { ReactionRole } = require('../data/models');

module.exports = {
    name: 'messageReactionAdd',
    async execute(reaction, user) {
        if (user.bot) return;
        try {
            if (reaction.partial) await reaction.fetch().catch(() => null);
            if (!reaction.message.guild) return;

            const record = await ReactionRole.findOne({ where: { messageId: reaction.message.id } });
            if (!record) return;

            const mapping = JSON.parse(record.mapping || '{}');
            const emojiKey = reaction.emoji.id ? `<:${reaction.emoji.name}:${reaction.emoji.id}>` : reaction.emoji.name;
            const roleId = mapping[emojiKey] || mapping[reaction.emoji.name];
            if (!roleId) return;

            const member = await reaction.message.guild.members.fetch(user.id).catch(() => null);
            if (!member) return;

            if (record.mode === 'unique') {
                // Quita cualquier otro rol de este mismo panel antes de añadir el nuevo.
                const allRoleIds = Object.values(mapping);
                for (const rid of allRoleIds) {
                    if (rid !== roleId && member.roles.cache.has(rid)) {
                        await member.roles.remove(rid).catch(() => {});
                    }
                }
            }

            await member.roles.add(roleId).catch(() => {});
        } catch (err) {
            console.error('[reactionRoles] Error en messageReactionAdd:', err);
        }
    },
};
