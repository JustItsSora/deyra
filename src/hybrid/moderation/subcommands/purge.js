const { PermissionsBitField, MessageFlags } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel, warningPanel } = require('../../../lib/panel');
const config = require('../../../config');

const FOURTEEN_DAYS_MS = 14 * 24 * 60 * 60 * 1000;

/**
 * Borra hasta `amount` mensajes que cumplan `filterFn`, yendo hacia atrás en
 * el historial del canal en lotes de 100 (límite real de fetch/bulkDelete de
 * Discord: no se puede pedir ni borrar más de 100 por llamada, así que para
 * llegar a 500 se hacen varias vueltas). Se corta si llega a mensajes de más
 * de 14 días, porque Discord no permite bulk-delete sobre esos.
 */
async function purgeMessages(channel, amount, filterFn) {
    let totalDeleted = 0;
    let before;
    let hitAgeLimit = false;

    while (totalDeleted < amount) {
        const fetched = await channel.messages.fetch({ limit: 100, before });
        if (fetched.size === 0) break;

        before = fetched.last().id;

        const now = Date.now();
        const candidates = [...fetched.values()].filter((m) => {
            if (now - m.createdTimestamp > FOURTEEN_DAYS_MS) {
                hitAgeLimit = true;
                return false;
            }
            return filterFn(m);
        });

        if (candidates.length > 0) {
            const toDelete = candidates.slice(0, amount - totalDeleted);
            const deleted = await channel.bulkDelete(toDelete, true);
            totalDeleted += deleted.size;
        }

        if (fetched.size < 100) break;
    }

    return { totalDeleted, hitAgeLimit };
}

function isCommandInvocation(message, prefix) {
    if (message.content && message.content.startsWith(prefix)) return true;
    // Respuestas de slash commands del propio bot también cuentan como "comando".
    if (message.interactionMetadata || message.interaction) return true;
    return false;
}

module.exports = {
    async execute(ctx, args) {
        const guild = ctx.guild;
        const executorId = getUserId(ctx);
        const executor = guild.members.cache.get(executorId) || await guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ManageMessages)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Gestionar Mensajes**.'), ephemeral: true });
        }

        let amount;
        let targetUserId;
        let onlyBots;
        let onlyCommands;

        if (isSlash(ctx)) {
            amount = ctx.options.getInteger('cantidad');
            targetUserId = ctx.options.getUser('usuario')?.id;
            onlyBots = ctx.options.getBoolean('solo_bots') || false;
            onlyCommands = ctx.options.getBoolean('solo_comandos') || false;
        } else {
            // Prefijo: !mod purge <cantidad> [@usuario] [bots] [comandos]
            const rest = args || [];
            amount = parseInt(rest[0], 10);
            const mention = rest.find((a) => /^<@!?\d+>$/.test(a));
            targetUserId = mention?.replace(/[<@!>]/g, '');
            onlyBots = rest.includes('bots');
            onlyCommands = rest.includes('comandos');
        }

        if (!amount || amount < 1 || amount > 500) {
            return reply(ctx, { ...errorPanel('Cantidad inválida', 'Especificá un número entre 1 y 500.'), ephemeral: true });
        }

        const channel = ctx.channel;
        if (isSlash(ctx)) await ctx.deferReply({ flags: MessageFlags.Ephemeral});

        const prefix = config.PREFIX;
        const filterFn = (m) => {
            if (targetUserId && m.author.id !== targetUserId) return false;
            if (onlyBots && !m.author.bot) return false;
            if (onlyCommands && !isCommandInvocation(m, prefix)) return false;
            return true;
        };

        try {
            const { totalDeleted, hitAgeLimit } = await purgeMessages(channel, amount, filterFn);

            if (totalDeleted === 0) {
                return reply(ctx, { ...warningPanel('Nada para borrar', 'No encontré mensajes que coincidan con esos filtros en el historial reciente del canal.'), ephemeral: true });
            }

            const extra = hitAgeLimit
                ? '\n-# Se detuvo antes de lo pedido: Discord no permite borrar en lote mensajes de más de 14 días.'
                : '';

            return reply(ctx, { ...successPanel('Mensajes eliminados', `Se eliminaron **${totalDeleted}** mensaje(s).${extra}`), ephemeral: true });
        } catch (err) {
            console.error('[mod purge] Error:', err);
            return reply(ctx, { ...errorPanel('Error', 'No pude borrar los mensajes.'), ephemeral: true });
        }
    },
};
