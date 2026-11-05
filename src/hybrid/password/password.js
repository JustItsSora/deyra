const { SlashCommandBuilder } = require('discord.js');
const crypto = require('crypto');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const CHARSET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=';

module.exports = {
    data: new SlashCommandBuilder()
        .setName('password')
        .setDescription('Genera una contraseña segura aleatoria')
        .addIntegerOption(o => o.setName('longitud').setDescription('Longitud (8-64, default 16)').setMinValue(8).setMaxValue(64).setRequired(false)),

    name: 'password',
    aliases: ['contrasena', 'genpass'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const length = isSlash(ctx) ? (ctx.options.getInteger('longitud') || 16) : (parseInt(args[0], 10) || 16);
        const clampedLength = Math.min(64, Math.max(8, length));

        const bytes = crypto.randomBytes(clampedLength);
        const password = Array.from(bytes).map(b => CHARSET[b % CHARSET.length]).join('');

        return reply(ctx, { ...infoPanel('🔐 Contraseña generada', `\`\`\`${password}\`\`\`\n-# Este mensaje solo tú puedes verlo.`), ephemeral: true });
    },
};
