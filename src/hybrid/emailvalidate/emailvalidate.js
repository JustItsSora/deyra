const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('emailvalidate')
        .setDescription('Verifica si un texto tiene formato de email válido')
        .addStringOption(o => o.setName('email').setDescription('El email a validar').setRequired(true)),

    name: 'emailvalidate',
    aliases: ['validaremail'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const email = isSlash(ctx) ? ctx.options.getString('email') : args[0];
        if (!email) {
            return reply(ctx, { ...errorPanel('Falta el email', 'Especifica un email a validar.'), ephemeral: true });
        }

        const isValid = EMAIL_REGEX.test(email);
        return reply(ctx, isValid
            ? successPanel('Formato válido', `"${email}" tiene un formato de email válido.`)
            : errorPanel('Formato inválido', `"${email}" no tiene un formato de email válido.`));
    },
};
