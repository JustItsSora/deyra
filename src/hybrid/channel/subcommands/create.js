const { ChannelType } = require('discord.js');
const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/channel create`.');

        const name = ctx.options.getString('nombre');
        const category = ctx.options.getChannel('categoria');

        try {
            const channel = await ctx.guild.channels.create({
                name,
                type: ChannelType.GuildText,
                parent: category?.id,
            });
            return reply(ctx, successPanel('Canal creado', `Se creó el canal ${channel}.`));
        } catch (err) {
            console.error('[channel create] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude crear el canal.'), ephemeral: true });
        }
    },
};
