const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('accountage')
        .setDescription('Muestra cuánto tiempo lleva creada la cuenta de un usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    name: 'accountage',
    aliases: ['edadcuenta'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const userId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const user = await ctx.client.users.fetch(userId).catch(() => null);

        if (!user) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario.'), ephemeral: true });
        }

        const days = Math.floor((Date.now() - user.createdTimestamp) / 86400000);
        return reply(ctx, infoPanel(`Antigüedad de la cuenta de ${user.username}`, `Creada <t:${Math.floor(user.createdTimestamp / 1000)}:D> (hace ${days.toLocaleString('es-ES')} días).`));
    },
};
