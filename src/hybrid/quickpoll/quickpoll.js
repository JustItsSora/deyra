const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { buildPanel, errorPanel } = require('../../lib/panel');
const { MessageFlags } = require('discord.js');

const NUMBER_EMOJIS = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣'];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('quickpoll')
        .setDescription('Crea una encuesta con hasta 8 opciones usando reacciones')
        .addStringOption(o => o.setName('pregunta').setDescription('La pregunta').setRequired(true))
        .addStringOption(o => o.setName('opciones').setDescription('Opciones separadas por comas (2-8)').setRequired(true)),

    name: 'quickpoll',
    aliases: ['encuestarapida'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        let question, optionsRaw;
        if (isSlash(ctx)) {
            question = ctx.options.getString('pregunta');
            optionsRaw = ctx.options.getString('opciones');
        } else {
            [question, optionsRaw] = args.join(' ').split('|').map(s => s?.trim());
        }

        if (!question || !optionsRaw) {
            return reply(ctx, { ...errorPanel('Datos inválidos', 'Uso: `/quickpoll pregunta:<texto> opciones:<a,b,c>`'), ephemeral: true });
        }

        const options = optionsRaw.split(',').map(o => o.trim()).filter(Boolean);
        if (options.length < 2 || options.length > 8) {
            return reply(ctx, { ...errorPanel('Cantidad inválida', 'Debes dar entre 2 y 8 opciones.'), ephemeral: true });
        }

        const description = options.map((o, i) => `${NUMBER_EMOJIS[i]} ${o}`).join('\n');
        const panel = buildPanel({ title: `📊 ${question}`, description, tone: 'primary' });

        const sent = await ctx.channel.send({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => null);
        if (sent) {
            for (let i = 0; i < options.length; i++) {
                await sent.react(NUMBER_EMOJIS[i]).catch(() => {});
            }
        }

        if (isSlash(ctx)) return ctx.reply({ content: 'Encuesta creada.', flags: MessageFlags.Ephemeral}).catch(() => {});
    },
};
