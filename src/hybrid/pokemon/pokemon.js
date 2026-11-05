const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const config = require('../../config');

// PokeAPI — completamente gratuita, sin key. https://pokeapi.co
async function fetchPokemon(name) {
    const res = await fetch(`https://pokeapi.co/api/v2/pokemon/${encodeURIComponent(name.toLowerCase())}`);
    if (!res.ok) throw new Error(`pokeapi ${res.status}`);
    return res.json();
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pokemon')
        .setDescription('Busca información de un Pokémon')
        .addStringOption(o => o.setName('nombre').setDescription('Nombre o número del Pokémon').setRequired(true)),

    name: 'pokemon',
    aliases: ['poke'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const query = isSlash(ctx) ? ctx.options.getString('nombre') : args.join(' ');
        if (!query) {
            return reply(ctx, { ...errorPanel('Falta el nombre', 'Especifica el nombre o número de un Pokémon.'), ephemeral: true });
        }

        let data;
        try {
            data = await fetchPokemon(query);
        } catch {
            return reply(ctx, { ...errorPanel('No encontrado', 'No encontré un Pokémon con ese nombre o número.'), ephemeral: true });
        }

        const types = data.types.map(t => t.type.name).join(', ');
        const sprite = data.sprites?.other?.['official-artwork']?.front_default || data.sprites?.front_default;

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent(
            `## ${data.name.charAt(0).toUpperCase() + data.name.slice(1)} (#${data.id})\n**Tipo(s):** ${types}\n**Altura:** ${data.height / 10}m · **Peso:** ${data.weight / 10}kg`,
        ));
        if (sprite) {
            container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(sprite)));
        }

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
