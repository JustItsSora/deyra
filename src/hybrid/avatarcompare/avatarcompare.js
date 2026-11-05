const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatarcompare')
        .setDescription('Muestra los avatares de dos usuarios lado a lado')
        .addUserOption(o => o.setName('usuario1').setDescription('Primer usuario').setRequired(true))
        .addUserOption(o => o.setName('usuario2').setDescription('Segundo usuario').setRequired(true)),

    name: 'avatarcompare',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let idA, idB;
        if (isSlash(ctx)) {
            idA = ctx.options.getUser('usuario1')?.id;
            idB = ctx.options.getUser('usuario2')?.id;
        } else {
            idA = args[0]?.replace(/[<@!>]/g, '');
            idB = args[1]?.replace(/[<@!>]/g, '');
        }

        const userA = idA ? await ctx.client.users.fetch(idA).catch(() => null) : null;
        const userB = idB ? await ctx.client.users.fetch(idB).catch(() => null) : null;

        if (!userA || !userB) {
            return reply(ctx, { ...errorPanel('Usuarios inválidos', 'Especifica dos usuarios válidos.'), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## ${userA.username} vs ${userB.username}`));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(
            new MediaGalleryItemBuilder().setURL(userA.displayAvatarURL({ size: 512, extension: 'png' })),
            new MediaGalleryItemBuilder().setURL(userB.displayAvatarURL({ size: 512, extension: 'png' })),
        ));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
