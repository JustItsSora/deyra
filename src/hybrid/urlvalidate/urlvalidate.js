const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('urlvalidate')
        .setDescription('Verifica si un texto es una URL válida')
        .addStringOption(o => o.setName('url').setDescription('La URL a validar').setRequired(true)),

    name: 'urlvalidate',
    aliases: ['validarurl'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const url = isSlash(ctx) ? ctx.options.getString('url') : args[0];
        if (!url) {
            return reply(ctx, { ...errorPanel('Falta la URL', 'Especifica una URL a validar.'), ephemeral: true });
        }

        try {
            const parsed = new URL(url);
            return reply(ctx, successPanel('URL válida', `**Protocolo:** ${parsed.protocol}\n**Dominio:** ${parsed.hostname}`));
        } catch {
            return reply(ctx, errorPanel('URL inválida', `"${url}" no es una URL válida (recuerda incluir \`https://\`).`));
        }
    },
};
