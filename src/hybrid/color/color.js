const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');

function isValidHex(hex) {
    return /^#?[0-9a-fA-F]{6}$/.test(hex);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('color')
        .setDescription('Muestra información de un color en formato HEX')
        .addStringOption(o => o.setName('hex').setDescription('Código HEX, ej: #2B7FFF').setRequired(true)),

    name: 'color',
    aliases: [],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const raw = isSlash(ctx) ? ctx.options.getString('hex') : args[0];
        if (!raw || !isValidHex(raw)) {
            return reply(ctx, { ...errorPanel('Código inválido', 'Proporciona un color en formato HEX válido, ej: `#2B7FFF`.'), ephemeral: true });
        }

        const hex = raw.startsWith('#') ? raw : `#${raw}`;
        const intVal = parseInt(hex.slice(1), 16);
        const r = (intVal >> 16) & 255;
        const g = (intVal >> 8) & 255;
        const b = intVal & 255;

        const container = new ContainerBuilder().setAccentColor(intVal);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## 🎨 Color ${hex.toUpperCase()}\n**RGB:** ${r}, ${g}, ${b}\n**Decimal:** ${intVal}`,
        ));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
