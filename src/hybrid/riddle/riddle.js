const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply } = require('../../lib/reply');
const { buildPanel } = require('../../lib/panel');

const RIDDLES = [
    { q: 'Tengo ciudades, pero no casas; montañas, pero no árboles; agua, pero no peces. ¿Qué soy?', a: 'Un mapa' },
    { q: 'Cuanto más quitas, más grande me hago. ¿Qué soy?', a: 'Un hoyo' },
    { q: 'No tengo vida, pero puedo morir. ¿Qué soy?', a: 'Una batería' },
    { q: 'Entre más seco esté, más mojado se pone. ¿Qué es?', a: 'Una toalla' },
    { q: 'Puedes atraparme pero no lanzarme. ¿Qué soy?', a: 'Un resfriado' },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('riddle')
        .setDescription('Resuelve un acertijo aleatorio'),

    name: 'riddle',
    aliases: ['acertijo'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        const pick = RIDDLES[Math.floor(Math.random() * RIDDLES.length)];

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`riddle_reveal_${Buffer.from(pick.a).toString('base64').slice(0, 90)}`).setLabel('Ver respuesta').setStyle(ButtonStyle.Secondary).setEmoji('💡'),
        );

        const panel = buildPanel({ title: '🧩 Acertijo', description: pick.q, tone: 'primary', rows: [row] });
        return reply(ctx, { components: [panel], flags: MessageFlags.IsComponentsV2 });
    },
};
