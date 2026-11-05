const { SlashCommandBuilder, MessageFlags, ContainerBuilder, TextDisplayBuilder, MediaGalleryBuilder, MediaGalleryItemBuilder } = require("discord.js");
const { reply } = require("../../lib/reply");
const { errorPanel } = require("../../lib/panel");
const config = require("../../config");

async function fetchImage() {
    const res = await fetch("https://some-random-api.com/animal/bird");
    if (!res.ok) throw new Error(`some-random-api ${res.status}`);
    const data = await res.json();
    if (!data.image) throw new Error("Sin imagen en la respuesta");
    return data.image;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName("bird")
        .setDescription("Muestra una imagen aleatoria de un pájaro"),

    name: "bird",
    aliases: [],
    category: "diversión",
    cooldownMs: 2000,

    async execute(ctx) {
        let url;
        try {
            url = await fetchImage();
        } catch (err) {
            console.error("[bird] Error:", err);
            return reply(ctx, { ...errorPanel("Error", "No pude obtener una imagen en este momento."), ephemeral: true });
        }

        const container = new ContainerBuilder().setAccentColor(config.COLORS.PRIMARY);
        container.addTextDisplayComponents(new TextDisplayBuilder().setContent("## 🐦 Pájaro"));
        container.addMediaGalleryComponents(new MediaGalleryBuilder().addItems(new MediaGalleryItemBuilder().setURL(url)));

        return reply(ctx, { components: [container], flags: MessageFlags.IsComponentsV2 });
    },
};
