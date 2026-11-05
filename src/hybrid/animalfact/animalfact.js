// src/hybrid/animalfact/animalfact.js
const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, SeparatorBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

// Especies soportadas por el endpoint /animal/<especie> de some-random-api,
// que devuelve imagen + dato curioso juntos.
const ANIMALS = ['bird', 'cat', 'dog', 'fox', 'kangaroo', 'koala', 'panda', 'raccoon', 'red_panda'];

async function fetchAnimalFact(animal) {
    const res = await fetch(`https://some-random-api.com/animal/${animal}`);
    if (!res.ok) throw new Error(`some-random-api ${res.status}`);
    return res.json();
}

module.exports = {
    data: new SlashCommandBuilder().setName('animalfact').setDescription('Muestra un dato curioso al azar sobre un animal, con foto'),

    name: 'animalfact',
    aliases: ['datoanimal'],
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        const animal = ANIMALS[Math.floor(Math.random() * ANIMALS.length)];
        let data;
        try {
            data = await fetchAnimalFact(animal);
        } catch (err) {
            console.error('[animalfact] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude obtener un dato curioso en este momento.'), ephemeral: true });
        }

        if (!data?.fact) {
            return reply(ctx, { ...errorPanel('Sin resultados', 'No encontré ningún dato curioso ahora mismo.'), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY)
            .addTextDisplayComponents(new TextDisplayBuilder().setContent('### 🔎 Dato curioso de animal'))
            .addSeparatorComponents(new SeparatorBuilder())
            .addTextDisplayComponents(new TextDisplayBuilder().setContent(data.fact));

        if (data.image) {
            container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(data.image)));
        }

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
