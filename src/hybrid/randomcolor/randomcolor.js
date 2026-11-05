const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('randomcolor')
        .setDescription('Genera un color aleatorio en formato HEX'),

    name: 'randomcolor',
    aliases: ['colorAleatorio'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const intVal = Math.floor(Math.random() * 0xFFFFFF);
        const hex = `#${intVal.toString(16).padStart(6, '0').toUpperCase()}`;

        const container = new ContainerBuilder().setAccentColor(intVal);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(`## 🎨 Color aleatorio\n**${hex}**`));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
