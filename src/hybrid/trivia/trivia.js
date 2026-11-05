const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply } = require('../../lib/reply');
const { buildPanel, errorPanel } = require('../../lib/panel');

// Open Trivia DB — pública, gratuita, sin API key. https://opentdb.com
async function fetchTrivia() {
    const res = await fetch('https://opentdb.com/api.php?amount=1&type=multiple');
    if (!res.ok) throw new Error(`opentdb ${res.status}`);
    const data = await res.json();
    const q = data.results?.[0];
    if (!q) throw new Error('Sin pregunta en la respuesta');
    return q;
}

function decodeHtml(str) {
    return str
        .replace(/&quot;/g, '"').replace(/&#039;/g, "'").replace(/&amp;/g, '&')
        .replace(/&eacute;/g, 'é').replace(/&uacute;/g, 'ú').replace(/&aacute;/g, 'á')
        .replace(/&iacute;/g, 'í').replace(/&oacute;/g, 'ó').replace(/&ntilde;/g, 'ñ');
}

function shuffle(arr) {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('trivia')
        .setDescription('Responde una pregunta de trivia aleatoria'),

    name: 'trivia',
    aliases: [],
    category: 'diversión',
    cooldownMs: 4000,

    async execute(ctx) {
        let q;
        try {
            q = await fetchTrivia();
        } catch (err) {
            console.error('[trivia] Error obteniendo pregunta:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener una pregunta de trivia en este momento.'), ephemeral: true });
        }

        const question = decodeHtml(q.question);
        const correct = decodeHtml(q.correct_answer);
        const options = shuffle([...q.incorrect_answers.map(decodeHtml), correct]);

        const row = new ActionRowBuilder().addComponents(
            options.map((opt, i) => new ButtonBuilder()
                .setCustomId(`trivia_${opt === correct ? 'correct' : 'wrong'}_${i}`)
                .setLabel(opt.slice(0, 80))
                .setStyle(ButtonStyle.Primary)),
        );

        const panel = buildPanel({
            title: `🧠 Trivia — ${decodeHtml(q.category)}`,
            description: `**${question}**\n\nDificultad: \`${q.difficulty}\``,
            tone: 'primary',
            rows: [row],
        });

        return reply(ctx, { components: [panel], flags: MessageFlags.IsComponentsV2 });
    },
};
