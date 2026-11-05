const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('hash')
        .setDescription('Genera el hash de un texto (MD5, SHA1, SHA256)')
        .addStringOption(o => o.setName('algoritmo').setDescription('Algoritmo').setRequired(true)
            .addChoices({ name: 'MD5', value: 'md5' }, { name: 'SHA1', value: 'sha1' }, { name: 'SHA256', value: 'sha256' }))
        .addStringOption(o => o.setName('texto').setDescription('Texto a hashear').setRequired(true)),

    name: 'hash',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        let algo, text;
        if (isSlash(ctx)) {
            algo = ctx.options.getString('algoritmo');
            text = ctx.options.getString('texto');
        } else {
            algo = args[0]?.toLowerCase();
            text = args.slice(1).join(' ');
        }

        if (!['md5', 'sha1', 'sha256'].includes(algo) || !text) {
            return reply(ctx, { ...errorPanel('Uso incorrecto', 'Uso: `/hash algoritmo:<md5|sha1|sha256> texto:<texto>`'), ephemeral: true });
        }

        const result = crypto.createHash(algo).update(text).digest('hex');
        return reply(ctx, infoPanel(`Hash ${algo.toUpperCase()}`, `\`\`\`${result}\`\`\``));
    },
};
