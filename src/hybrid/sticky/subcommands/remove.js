const { reply } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { StickyMessage } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        const sticky = await StickyMessage.findOne({ where: { channelId: ctx.channel.id } });
        if (!sticky) {
            return reply(ctx, { ...errorPanel('No configurado', 'Este canal no tiene un mensaje fijo.'), ephemeral: true });
        }

        if (sticky.lastMessageId) {
            const old = await ctx.channel.messages.fetch(sticky.lastMessageId).catch(() => null);
            if (old) await old.delete().catch(() => {});
        }

        await sticky.destroy();
        return reply(ctx, { ...successPanel('Mensaje fijo eliminado', 'Ya no se reenviará este mensaje en el canal.'), ephemeral: true });
    },
};
