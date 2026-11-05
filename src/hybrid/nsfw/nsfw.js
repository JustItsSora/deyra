// src/hybrid/nsfw/nsfw.js
// Interruptor de política de contenido del servidor.
//
// Solo alguien con "Gestionar servidor" puede tocarlo. Por defecto está en
// "deshabilitado" (todo SFW), que es el estado recomendado y el que asumen
// todos los comandos de contenido del bot.

const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const policy = require('../../lib/contentPolicy');
const ui = require('../../lib/ui');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nsfw')
        .setDescription('Activa o desactiva el contenido para adultos en este servidor')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addBooleanOption(o => o
            .setName('activar')
            .setDescription('true = permitir contenido adulto · false = todo SFW (recomendado)')
            .setRequired(false)),

    name: 'nsfw',
    aliases: ['politica', 'sfw'],
    category: 'configuración',
    cooldownMs: 3000,

    async execute(ctx, args = []) {
        const guildId = ctx.guild?.id;
        if (!guildId) {
            return reply(ctx, ui.error('Solo en servidores', 'Esta configuración es por servidor. No aplica en mensajes privados.'));
        }

        const current = await policy.getPolicy(guildId);

        // Sin argumento → solo muestra el estado.
        let requested = null;
        if (isSlash(ctx)) {
            requested = ctx.options.getBoolean('activar');
        } else {
            const raw = String(args[0] || '').toLowerCase();
            if (['true', 'si', 'sí', 'on', '1', 'activar', 'enable'].includes(raw)) requested = true;
            else if (['false', 'no', 'off', '0', 'desactivar', 'disable'].includes(raw)) requested = false;
        }

        if (requested === null) {
            return reply(ctx, ui.payload({
                category: 'configuración',
                kicker: 'Política de contenido',
                title: 'Estado actual',
                icon: current.nsfw ? '🔓' : '🔒',
                description: policy.describe(current),
                grid: [
                    ['Contenido adulto', current.nsfw ? '🟢 Permitido' : '🔴 Bloqueado'],
                    ['GIFs e imágenes', '🟢 SFW siempre'],
                    ['Imágenes con spoiler', '🟢 Siempre disponibles'],
                ],
                callouts: [{
                    tone: 'info',
                    text: 'Uso: `!nsfw true` o `!nsfw false`. Requiere **Gestionar servidor**.',
                }],
            }));
        }

        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId)
            || await ctx.guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, ui.noPermission(
                'Necesitás el permiso **Gestionar servidor** para cambiar la política de contenido.',
                { required: 'ManageGuild' },
            ));
        }

        if (requested === current.nsfw) {
            return reply(ctx, ui.info(
                'Sin cambios',
                requested
                    ? 'El contenido para adultos ya estaba habilitado en este servidor.'
                    : 'El contenido para adultos ya estaba deshabilitado (todo SFW).',
                { category: 'configuración', icon: 'ℹ️' },
            ));
        }

        try {
            await policy.setPolicy(guildId, { nsfw: requested });
        } catch (err) {
            console.error('[nsfw] No pude guardar la política:', err);
            return reply(ctx, ui.internalError(err, { context: 'guardar política de contenido' }));
        }

        const auditLine = `-# Cambiado por <@${executorId}> · ${new Date().toLocaleString('es-AR')}`;

        return reply(ctx, ui.payload({
            category: 'configuración',
            tone: requested ? 'warning' : 'success',
            kicker: 'Política de contenido',
            title: requested ? 'Contenido adulto habilitado' : 'Todo SFW',
            icon: requested ? '🔓' : '🔒',
            description: requested
                ? 'A partir de ahora este servidor permite contenido adulto. Recordá que ese contenido puede no ser apropiado para canales compartidos con menores.'
                : 'Volvimos al modo seguro: **todo** el contenido del bot es apto para cualquier edad.',
            callouts: [{ tone: 'muted', text: 'Los GIFs e imágenes que trae el bot son SFW en cualquier caso.' }],
            footerText: auditLine,
        }));
    },
};
