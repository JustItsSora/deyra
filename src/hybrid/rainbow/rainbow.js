const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');

// Discord soporta color en bloques ```ansi usando códigos ANSI. Ciclamos por
// varios colores de texto para dar un efecto "arcoíris" carácter por carácter.
const ANSI_COLORS = [31, 33, 32, 36, 34, 35]; // rojo, amarillo, verde, cian, azul, magenta

module.exports = {
    data: new SlashCommandBuilder()
        .setName('rainbow')
        .setDescription('Colorea un texto con estilo arcoíris usando bloques ANSI')
        .addStringOption(o => o.setName('texto').setDescription('Texto (máx 100 caracteres)').setRequired(true)),

    name: 'rainbow',
    aliases: ['arcoiris'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a colorear.'), ephemeral: true });
        }
        if (text.length > 100) {
            return reply(ctx, { ...errorPanel('Muy largo', 'Máximo 100 caracteres.'), ephemeral: true });
        }

        const colored = [...text].map((char, i) => `\u001b[${ANSI_COLORS[i % ANSI_COLORS.length]}m${char}`).join('');
        return reply(ctx, { content: `\`\`\`ansi\n${colored}\u001b[0m\n\`\`\`` });
    },
};
