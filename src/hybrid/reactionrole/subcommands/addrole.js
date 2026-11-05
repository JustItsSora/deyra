const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { ReactionRole } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/reactionrole addrole`.');

        const messageId = ctx.options.getString('message_id');
        const emoji = ctx.options.getString('emoji');
        const role = ctx.options.getRole('rol');

        const record = await ReactionRole.findOne({ where: { guildId: ctx.guild.id, messageId } });
        if (!record) {
            return reply(ctx, { ...errorPanel('No encontrado', 'No hay un panel de reaction roles con ese ID de mensaje.'), ephemeral: true });
        }

        const channel = await ctx.guild.channels.fetch(record.channelId).catch(() => null);
        const message = channel ? await channel.messages.fetch(messageId).catch(() => null) : null;

        if (!message) {
            return reply(ctx, { ...errorPanel('Mensaje no encontrado', 'No pude encontrar el mensaje del panel. Puede haber sido eliminado.'), ephemeral: true });
        }

        try {
            await message.react(emoji);
        } catch {
            return reply(ctx, { ...errorPanel('Emoji inválido', 'No pude reaccionar con ese emoji. Verifica que sea válido y que el bot tenga acceso a él.'), ephemeral: true });
        }

        const mapping = JSON.parse(record.mapping || '{}');
        mapping[emoji] = role.id;
        record.mapping = JSON.stringify(mapping);
        await record.save();

        return reply(ctx, successPanel('Emoji-rol añadido', `Reaccionar con ${emoji} otorgará el rol ${role}.`));
    },
};
