const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('usercolor')
        .setDescription('Muestra el color de rol de un usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    name: 'usercolor',
    aliases: ['colorusuario'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const userId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const member = await ctx.guild.members.fetch(userId).catch(() => null);

        if (!member) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario.'), ephemeral: true });
        }

        const hex = member.displayHexColor === '#000000' ? '#99AAB5 (color por defecto)' : member.displayHexColor;
        const colorInt = member.displayColor || 0x99AAB5;

        const container = new ContainerBuilder().setAccentColor(colorInt);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## Color de ${member.user.username}\n**${hex}**`));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
