const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('colorpalette')
        .setDescription('Genera una paleta de 5 colores complementarios aleatorios'),

    name: 'colorpalette',
    aliases: ['paleta'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const baseHue = Math.floor(Math.random() * 360);
        const colors = [0, 30, 60, 180, 210].map(offset => {
            const hue = (baseHue + offset) % 360;
            return hslToHex(hue, 65, 55);
        });

        const container = new ContainerBuilder().setAccentColor(parseInt(colors[0].slice(1), 16));
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## 🎨 Paleta de colores\n${colors.map(c => `\`${c}\``).join('  ')}`,
        ));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};

function hslToHex(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    const f = n => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    const toHex = x => Math.round(255 * x).toString(16).padStart(2, '0');
    return `#${toHex(f(0))}${toHex(f(8))}${toHex(f(4))}`.toUpperCase();
}
