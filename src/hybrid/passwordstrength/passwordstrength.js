const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

function evaluateStrength(pw) {
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;

    const labels = ['Muy débil', 'Débil', 'Aceptable', 'Fuerte', 'Muy fuerte', 'Excelente'];
    return labels[score];
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('passwordstrength')
        .setDescription('Evalúa qué tan segura es una contraseña (no la almacena)')
        .addStringOption(o => o.setName('contrasena').setDescription('La contraseña a evaluar').setRequired(true)),

    name: 'passwordstrength',
    aliases: ['fuerzacontrasena'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const pw = isSlash(ctx) ? ctx.options.getString('contrasena') : args[0];
        if (!pw) {
            return reply(ctx, { ...errorPanel('Falta la contraseña', 'Especifica una contraseña a evaluar.'), ephemeral: true });
        }

        const strength = evaluateStrength(pw);
        return reply(ctx, { ...infoPanel('🔒 Fuerza de contraseña', `**${strength}**\n\n-# Este mensaje solo tú puedes verlo. Nunca compartas tus contraseñas reales, ni siquiera con bots.`), ephemeral: true });
    },
};
