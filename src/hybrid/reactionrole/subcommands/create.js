const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel, buildPanel } = require('../../../lib/panel');
const { ReactionRole } = require('../../../data/models');
const { MessageFlags } = require('discord.js');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/reactionrole create`.');

        const channel = ctx.options.getChannel('canal');
        const title = ctx.options.getString('titulo');
        const description = ctx.options.getString('descripcion') || 'Reacciona para obtener un rol.';

        const panel = buildPanel({ title: `🎭 ${title}`, description, tone: 'primary' });
        const sent = await channel.send({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => null);

        if (!sent) {
            return reply(ctx, { ...errorPanel('Error', 'No pude enviar el panel a ese canal.'), ephemeral: true });
        }

        await ReactionRole.create({ guildId: ctx.guild.id, messageId: sent.id, channelId: channel.id, mapping: '{}' });

        return reply(ctx, successPanel('Panel creado', `Panel publicado en ${channel}.\nID del mensaje: \`${sent.id}\`\n\nUsa \`/reactionrole addrole\` para añadir emoji-rol.`));
    },
};
