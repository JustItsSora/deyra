// src/hybrid/channel/subcommands/nsfw.js
const { PermissionsBitField } = require('discord.js');
const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { missingBotPermissions } = require('../../../lib/permissions');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/channel nsfw`.');

        const active = ctx.options.getBoolean('activo');

        // Discord devuelve 50013 (Missing Permissions) si el bot no tiene
        // "Administrar canales" EN ESTE CANAL. Mejor decirlo claro que dejar
        // un stack en la consola y un error genérico al usuario.
        const missing = await missingBotPermissions(ctx.guild, ctx.channel, [PermissionsBitField.Flags.ManageChannels]);
        if (missing.length) {
            return reply(ctx, {
                ...errorPanel(
                    'Me falta un permiso',
                    `No puedo marcar este canal como **${active ? 'NSFW' : 'no NSFW'}** porque no tengo el permiso **${missing.join(', ')}** acá.`,
                ),
                ephemeral: true,
            });
        }

        try {
            await ctx.channel.setNSFW(active);
            return reply(ctx, successPanel('Canal actualizado', `Este canal ahora está marcado como **${active ? 'NSFW' : 'no NSFW'}**.`));
        } catch (err) {
            console.error('[channel nsfw] Error:', err.message || err);
            return reply(ctx, { ...errorPanel('Error', 'No pude cambiar esa propiedad.'), ephemeral: true });
        }
    },
};
