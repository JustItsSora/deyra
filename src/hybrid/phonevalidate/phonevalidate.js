const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');

// Validación básica de formato, no verifica que el número exista realmente.
const PHONE_REGEX = /^\+?[0-9\s\-()]{7,20}$/;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('phonevalidate')
        .setDescription('Verifica si un texto tiene formato de teléfono válido')
        .addStringOption(o => o.setName('telefono').setDescription('El número a validar').setRequired(true)),

    name: 'phonevalidate',
    aliases: ['validartelefono'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const phone = isSlash(ctx) ? ctx.options.getString('telefono') : args.join(' ');
        if (!phone) {
            return reply(ctx, { ...errorPanel('Falta el número', 'Especifica un número a validar.'), ephemeral: true });
        }

        const isValid = PHONE_REGEX.test(phone) && phone.replace(/[^0-9]/g, '').length >= 7;
        return reply(ctx, isValid
            ? successPanel('Formato válido', `"${phone}" tiene un formato de teléfono válido.\n\n-# Esto solo valida el formato, no confirma que el número exista.`)
            : errorPanel('Formato inválido', `"${phone}" no tiene un formato de teléfono válido.`));
    },
};
