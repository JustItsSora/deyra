const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const { getEdited } = require('../../lib/snipeStore');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('editsnipe')
        .setDescription('Muestra la última edición de mensaje en este canal'),

    name: 'editsnipe',
    aliases: ['esnipe'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const edited = getEdited(ctx.channel.id);
        if (!edited) {
            return reply(ctx, { ...errorPanel('Nada que mostrar', 'No hay ediciones recientes en este canal.'), ephemeral: true });
        }

        const secondsAgo = Math.floor((Date.now() - edited.timestamp) / 1000);
        return reply(ctx, infoPanel(`Mensaje editado (hace ${secondsAgo}s)`, `**${edited.authorTag}**\n**Antes:** ${edited.before}\n**Después:** ${edited.after}`));
    },
};
