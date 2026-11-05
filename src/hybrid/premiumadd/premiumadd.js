// src/hybrid/premiumadd/premiumadd.js
//
// /premiumadd — dar premium a un usuario o a un servidor. Solo owner.
//
// Puerto de /addprem y /removeprem del bot de música viejo. Diferencias:
//
//   · El de arriba se autoenviaba un POST HTTP a localhost para probar el
//     webhook de firma. Acá no hay webhook de pagos (Deyra no cobra todavía),
//     así que escribe directo en la base. Cuando exista el sistema de pagos, este
//     comando pasa a ser solo el fallback manual.
//   · El premium del bot viejo no vencía nunca (le habían borrado la columna
//     expires_at en una migración). Acá sí vence, y por default 30 días.
//
// Uso:
//   /premiumadd usuario @Ryu 30        → 30 días de premium a esa persona
//   /premiumadd servidor <#id> 30      → 30 días de premium a un server
//   /premiumadd quitar usuario @Ryu    → le saca el premium

const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel, warningPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');
const { UserPremium, GuildPremium } = require('../../data/models');
const { TIERS } = require('../../music/lib/access');

const DIAS_POR_DEFECTO = 30;
const MAX_DIAS = 3650;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('premiumadd')
        .setDescription('Da o quita premium (solo el owner del bot)')
        .addStringOption(o => o.setName('accion')
            .setDescription('Qué hacer')
            .setRequired(true)
            .addChoices(
                { name: 'Dar premium a un usuario', value: 'usuario' },
                { name: 'Dar premium a un servidor', value: 'servidor' },
                { name: 'Quitar premium a un usuario', value: 'quitar' },
            ))
        .addUserOption(o => o.setName('persona').setDescription('Usuario (para usuario o quitar)'))
        .addStringOption(o => o.setName('servidor_id').setDescription('ID del servidor (para servidor)'))
        .addStringOption(o => o.setName('tier').setDescription('Nivel del premium')
            .addChoices(
                { name: 'Lite', value: 'lite' },
                { name: 'Standard', value: 'basic' },
                { name: 'Ultra', value: 'premium' },
            ))
        .addIntegerOption(o => o.setName('dias').setDescription(`Días de duración (por defecto ${DIAS_POR_DEFECTO})`).setMinValue(1).setMaxValue(MAX_DIAS)),

    name: 'premiumadd',
    aliases: ['addprem', 'darpremium', 'giveprem'],
    category: 'owner',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        if (!isOwner(getUserId(ctx))) return;

        const accion = isSlash(ctx)
            ? ctx.options.getString('accion')
            : (args[0]?.toLowerCase() || '');
        const dias = (isSlash(ctx) ? ctx.options.getInteger('dias') : parseInt(args[3], 10)) || DIAS_POR_DEFECTO;
        const tier = (isSlash(ctx) ? ctx.options.getString('tier') : args[2]) || 'basic';

        if (!TIERS[tier]) {
            return reply(ctx, {
                ...errorPanel('Nivel inválido', `Los niveles son: ${Object.keys(TIERS).join(', ')}.`),
                ephemeral: true,
            });
        }

        const persona = isSlash(ctx) ? ctx.options.getUser('persona') : null;
        const serverId = isSlash(ctx) ? ctx.options.getString('servidor_id') : args[1];

        // ── quitar ──────────────────────────────────────────────────────────
        if (accion === 'quitar' || accion === 'remove' || accion === 'rm') {
            const objetivo = persona?.id || (args[1] || '').replace(/\D/g, '');
            if (!objetivo) {
                return reply(ctx, {
                    ...warningPanel('Falta el usuario', 'Uso: `/premiumadd quitar usuario @persona`'),
                    ephemeral: true,
                });
            }
            const borrados = await UserPremium.destroy({ where: { userId: objetivo } });
            return reply(ctx, borrados
                ? successPanel('Premium removido', `Le saqué el premium a <@${objetivo}>.`)
                : { ...warningPanel('No tenía premium', `<@${objetivo}> no tenía premium.`), ephemeral: true });
        }

        // ── premium de servidor ─────────────────────────────────────────────
        if (accion === 'servidor' || accion === 'server' || accion === 'guild') {
            const guildId = String(serverId || ctx.guild.id).replace(/\D/g, '');
            const expira = new Date(Date.now() + dias * 86_400_000);
            const [row] = await GuildPremium.findOrCreate({
                where: { guildId },
                defaults: { guildId, activatedBy: getUserId(ctx), activatedAt: new Date(), expiresAt: expira },
            });
            await row.update({ activatedBy: getUserId(ctx), expiresAt: expira });

            return reply(ctx, successPanel(
                'Premium de servidor',
                `<@${getUserId(ctx)}> activó el premium de este server por **${dias} días** (vence el ${expira.toLocaleDateString('es-AR')}).`,
                { lines: ['Con esto el server tiene menos límites en música y puede usar 24/7 y configuración por defecto.'] },
            ));
        }

        // ── premium de usuario ──────────────────────────────────────────────
        const objetivo = persona?.id || (args[1] || '').replace(/\D/g, '');
        if (!objetivo) {
            return reply(ctx, {
                ...warningPanel('Falta el usuario', 'Uso: `/premiumadd usuario @persona 30`'),
                ephemeral: true,
            });
        }

        const expira = new Date(Date.now() + dias * 86_400_000);
        const [row] = await UserPremium.findOrCreate({
            where: { userId: objetivo },
            defaults: { userId: objetivo, tier, serverActivations: TIERS[tier].serverActivations, activatedAt: new Date(), expiresAt: expira },
        });
        await row.update({ tier, serverActivations: TIERS[tier].serverActivations, expiresAt: expira });

        return reply(ctx, successPanel(
            'Premium activado',
            `<@${objetivo}> tiene **${TIERS[tier].label}** por ${dias} días (vence el ${expira.toLocaleDateString('es-AR')}).`,
            { lines: [`Puede activar premium en ${TIERS[tier].serverActivations} servidor${TIERS[tier].serverActivations === 1 ? '' : 'es'}.`] },
        ));
    },
};
