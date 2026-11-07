const { ChannelType, PermissionFlagsBits } = require('discord.js');
const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { HoneypotConfig } = require('../../../data/models');
const { invalidateCache } = require('../../../gateway/honeypot/honeypotEvents');

const LABELS = { timeout: 'Silenciar', kick: 'Expulsar', ban: 'Banear' };

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/honeypot setup`.');

        if (!ctx.memberPermissions?.has(PermissionFlagsBits.ManageChannels)) {
            return reply(ctx, errorPanel('Permiso insuficiente', 'Necesitas el permiso **Gestionar canales** para crear el señuelo.'));
        }

        const rawName = ctx.options.getString('nombre') || 'free-gifts';
        const name = rawName.toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/^-+|-+$/g, '').slice(0, 90) || 'free-gifts';
        const action = ctx.options.getString('accion') || 'kick';

        let channel;
        try {
            channel = await ctx.guild.channels.create({
                name,
                type: ChannelType.GuildText,
                topic: 'Ofertas y regalos del servidor. Canal de solo lectura: no escribas mensajes aquí.',
                reason: `Honeypot configurado por ${ctx.user.tag}`,
            });
        } catch (err) {
            console.error('[honeypot:setup]', err);
            return reply(ctx, errorPanel('No se pudo crear el canal', 'El bot necesita **Gestionar canales** y jerarquía suficiente.'));
        }

        const [config] = await HoneypotConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.channelId = channel.id;
        config.enabled = true;
        config.action = action;
        await config.save();
        invalidateCache(ctx.guild.id);

        const { sendHoneypotWarning } = require('../../../lib/honeypot');
        await sendHoneypotWarning(channel, { guild: ctx.guild, action, timeoutMinutes: config.timeoutMinutes });

        return reply(ctx, successPanel('Honeypot activado', `${channel} es ahora el canal señuelo. Quien escriba en él: **${LABELS[action]}**.`, {
            lines: ['_El canal se ve normal, pero ningún humano debería usarlo: el topic pide no escribir._', 'Si un miembro legítimo escribe, se aplica la acción igualmente. Avísalo en tus canales.'],
        }));
    },
};
