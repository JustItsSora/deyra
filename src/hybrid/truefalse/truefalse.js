const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply } = require('../../lib/reply');
const { buildPanel } = require('../../lib/panel');

const STATEMENTS = [
    { text: 'El corazón de un camarón está en su cabeza.', answer: true },
    { text: 'Los humanos solo usamos el 10% de nuestro cerebro.', answer: false },
    { text: 'La miel nunca se echa a perder.', answer: true },
    { text: 'El Monte Everest es la montaña más alta medida desde la base.', answer: false },
    { text: 'Los pulpos tienen tres corazones.', answer: true },
    { text: 'Los murciélagos son ciegos.', answer: false },
    { text: 'El sonido viaja más rápido en el agua que en el aire.', answer: true },
    { text: 'Las huellas dactilares de los koalas son casi idénticas a las humanas.', answer: true },
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('truefalse')
        .setDescription('Responde verdadero o falso a una afirmación'),

    name: 'truefalse',
    aliases: ['verdaderofalso'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        const statement = STATEMENTS[Math.floor(Math.random() * STATEMENTS.length)];

        const row = new ActionRowBuilder().addComponents(
            new ButtonBuilder().setCustomId(`truefalse_${statement.answer ? 'correct' : 'wrong'}_true`).setLabel('Verdadero').setStyle(ButtonStyle.Success),
            new ButtonBuilder().setCustomId(`truefalse_${!statement.answer ? 'correct' : 'wrong'}_false`).setLabel('Falso').setStyle(ButtonStyle.Danger),
        );

        const panel = buildPanel({ title: '🤔 ¿Verdadero o falso?', description: statement.text, tone: 'primary', rows: [row] });
        return reply(ctx, { components: [panel], flags: MessageFlags.IsComponentsV2 });
    },
};
