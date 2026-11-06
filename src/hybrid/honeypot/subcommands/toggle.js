const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { HoneypotConfig } = require('../../../data/models');
const { invalidateCache } = require('../../../gateway/honeypot/honeypotEvents');
const { ensureHoneypotChannel } = require('../../../lib/honeypot');
const { PermissionFlagsBits } = require('discord.js');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/honeypot toggle`.');

        const active = ctx.options.getBoolean('activo');

        if (active && !ctx.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
            return reply(ctx, errorPanel('Permiso insuficiente', 'Necesitas el permiso **Gestionar canales** para crear el señuelo automáticamente.'));
        }

        const [row] = await HoneypotConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });

        // Si no hay canal asignado, se crea uno propio con nombre señuelo.
        if (active && !row.channelId) {
            try {
                const channel = await ensureHoneypotChannel(ctx.guild);
                row.channelId = channel.id;
            } catch (err) {
                console.error('[honeypot:toggle] No se pudo crear el canal:', err);
                return reply(ctx, errorPanel('No se pudo crear el canal', 'El bot necesita **Gestionar canales** y jerarquía suficiente.'));
            }
        }

        row.enabled = active;
        await row.save();
        invalidateCache(ctx.guild.id);

        return reply(ctx, successPanel(active ? 'Honeypot activado' : 'Honeypot desactivado',
            active ? `La trampa está activa en <#${row.channelId}>.` : 'La trampa está apagada. El canal sigue existiendo, pero ya no se castiga a nadie.'));
    },
};
