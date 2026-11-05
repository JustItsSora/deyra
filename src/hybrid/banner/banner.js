const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { errorPanel, infoPanel } = require('../../lib/panel');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('banner')
        .setDescription('Muestra el banner de perfil de un usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    name: 'banner',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const userId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const user = await ctx.client.users.fetch(userId, { force: true }).catch(() => null);

        if (!user) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario.'), ephemeral: true });
        }
        if (!user.banner) {
            return reply(ctx, infoPanel('Sin banner', `${user.username} no tiene un banner de perfil configurado.`));
        }

        const url = user.bannerURL({ size: 1024, extension: 'png' });
        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Banner de ${user.username}`));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
