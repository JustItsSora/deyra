const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { StickyMessage } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        const content = isSlash(ctx) ? ctx.options.getString('mensaje') : args.join(' ');
        if (!content) {
            return reply(ctx, { ...errorPanel('Falta el mensaje', 'Especifica el contenido del mensaje fijo.'), ephemeral: true });
        }

        const [sticky] = await StickyMessage.findOrCreate({
            where: { channelId: ctx.channel.id },
            defaults: { guildId: ctx.guild.id, channelId: ctx.channel.id, content },
        });
        sticky.content = content;
        sticky.guildId = ctx.guild.id;
        await sticky.save();

        const sent = await ctx.channel.send(content).catch(() => null);
        if (sent) {
            sticky.lastMessageId = sent.id;
            await sticky.save();
        }

        return reply(ctx, { ...successPanel('Mensaje fijo configurado', 'Este mensaje se reenviará automáticamente después de cada mensaje nuevo en el canal.'), ephemeral: true });
    },
};
