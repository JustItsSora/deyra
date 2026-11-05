const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel, buildPanel } = require('../../../lib/panel');
const { GuildConfig } = require('../../../data/models');
const { MessageFlags } = require('discord.js');

// Contador simple en memoria para numerar confesiones (no crítico si se reinicia).
let counter = 0;

module.exports = {
    async execute(ctx, args) {
        const content = isSlash(ctx) ? ctx.options.getString('mensaje') : args.join(' ');
        if (!content) {
            return reply(ctx, { ...errorPanel('Falta el mensaje', 'Escribe tu confesión.'), ephemeral: true });
        }

        const guildConfig = await GuildConfig.findOne({ where: { guildId: ctx.guild.id } });
        if (!guildConfig?.confessionsChannelId) {
            return reply(ctx, { ...errorPanel('No configurado', 'El servidor no tiene un canal de confesiones configurado.'), ephemeral: true });
        }

        const channel = await ctx.guild.channels.fetch(guildConfig.confessionsChannelId).catch(() => null);
        if (!channel) {
            return reply(ctx, { ...errorPanel('Canal no disponible', 'El canal configurado ya no existe.'), ephemeral: true });
        }

        counter += 1;
        const panel = buildPanel({ title: `🤫 Confesión #${counter}`, description: content, tone: 'neutral' });
        await channel.send({ components: [panel], flags: MessageFlags.IsComponentsV2 }).catch(() => {});

        return reply(ctx, { ...successPanel('Confesión enviada', 'Tu confesión fue publicada de forma anónima.'), ephemeral: true });
    },
};
