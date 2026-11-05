const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const SMALL_CAPS_MAP = {
    a: 'ᴀ', b: 'ʙ', c: 'ᴄ', d: 'ᴅ', e: 'ᴇ', f: 'ꜰ', g: 'ɢ', h: 'ʜ', i: 'ɪ',
    j: 'ᴊ', k: 'ᴋ', l: 'ʟ', m: 'ᴍ', n: 'ɴ', o: 'ᴏ', p: 'ᴘ', q: 'ǫ', r: 'ʀ',
    s: 'ꜱ', t: 'ᴛ', u: 'ᴜ', v: 'ᴠ', w: 'ᴡ', x: 'x', y: 'ʏ', z: 'ᴢ',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('smallcaps')
        .setDescription('Convierte texto a ᴠᴇʀꜱᴀʟɪᴛᴀꜱ pequeñas')
        .addStringOption(o => o.setName('texto').setDescription('Texto a convertir').setRequired(true)),

    name: 'smallcaps',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const text = isSlash(ctx) ? ctx.options.getString('texto') : args.join(' ');
        if (!text) {
            return reply(ctx, { ...errorPanel('Falta el texto', 'Especifica el texto a convertir.'), ephemeral: true });
        }

        const result = [...text.toLowerCase()].map(c => SMALL_CAPS_MAP[c] || c).join('');
        return reply(ctx, infoPanel('Small Caps', result));
    },
};
