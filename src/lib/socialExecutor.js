// src/lib/socialExecutor.js
// Ejecutor único de TODAS las acciones sociales (/hug, /kiss, /bonk, /spin,
// /baka, ...). Cada comando en src/hybrid/ es de 15 líneas y delega acá, así
// que agregar una acción nueva es: 1) una línea en socialActions.js y
// 2) una carpeta de comando. No hay lógica duplicada.
//
// Lo que hace bien (antes estaba todo en un solo archivo y sin sistema visual):
//   · Un solo camino de providers con circuit breaker: si nekos.best está caído,
//     prueba purrbot y no espera 12 s en vano.
//   · Las acciones íntimas se pueden Aceptar o Rechazar, y el rechazo queda
//     registrado con el mismo estilo de panel.
//   · Conteo de interacciones por par (quién le hizo qué a quién), que se ve
//     como una línea de texto, no como un bloque.

// (sin imports de discord.js arriba a propósito: se importan acá para que este
// archivo se pueda cargar sin el bot conectado, en tests)

const { getActionGif } = require('./gifApi');
const { SOCIAL_ACTIONS, SOLO_PHRASES, SELF_ALLOWED } = require('./socialActions');
const { incrementInteraction } = require('./interactionCount');
const { reply, isSlash, getUserId, getUser } = require('./reply');
const ui = require('./ui');

const {
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
} = require('discord.js');

/** Crea los botones Aceptar/Rechazar de una acción dirigida. */
function consentRow(actionKey, authorId, targetId) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId(`social_accept_${actionKey}_${authorId}_${targetId}`)
            .setLabel('Aceptar')
            .setStyle(ButtonStyle.Success)
            .setEmoji('✅'),
        new ButtonBuilder()
            .setCustomId(`social_reject_${actionKey}_${authorId}_${targetId}`)
            .setLabel('Rechazar')
            .setStyle(ButtonStyle.Danger)
            .setEmoji('❌'),
    );
}

/** Resuelve el usuario objetivo desde slash o prefijo. */
async function resolveTarget(ctx, args) {
    if (isSlash(ctx)) return ctx.options.getUser('usuario');
    const raw = args[0]?.replace(/[<@!>]/g, '');
    if (!raw) return null;
    if (!/^\d{15,25}$/.test(raw)) return null;
    return ctx.client.users.fetch(raw).catch(() => null);
}

/**
 * Ejecuta una acción social.
 * @param {string} actionKey clave en SOCIAL_ACTIONS
 * @param {import('discord.js').Interaction|import('discord.js').Message} ctx
 * @param {string[]} [args] solo en modo prefijo
 */
async function executeSocialAction(actionKey, ctx, args = []) {
    const meta = SOCIAL_ACTIONS[actionKey];
    if (!meta) {
        return reply(ctx, ui.error('Acción desconocida', `No tengo ninguna acción llamada "${actionKey}".`, { ephemeral: true }));
    }

    const authorId = getUserId(ctx);
    const author = getUser(ctx);
    const gifCategory = meta.gif || actionKey;
    const actionName = meta.do ? meta.do.toLowerCase() : actionKey;

    // --- Objetivo ---
    let targetUser = null;
    if (!meta.solo) {
        targetUser = await resolveTarget(ctx, args);
        if (!targetUser) {
            return reply(ctx, ui.missingArgument(
                'Falta el usuario',
                `Usá \`usuario\` para elegir a quién. Ej: \`/${actionKey} usuario:@nombre\`.`,
                { usage: `/${actionKey} usuario:@nombre` },
            ));
        }
        if (targetUser.id === authorId && !SELF_ALLOWED.has(actionKey)) {
            return reply(ctx, ui.error(
                'No podés hacer eso a vos mismo',
                `No tiene sentido ${meta.do ? meta.do.toLowerCase() : actionKey} a vos mismo.`,
                { hint: 'Probá con otra persona del server.', ephemeral: true },
            ));
        }
    }

    // --- GIF (con proveedores y respaldo) ---
    let gif;
    try {
        gif = await getActionGif(gifCategory);
    } catch (err) {
        console.error(`[social] Sin GIF para "${actionKey}" (${gifCategory}):`, err.message);
        return reply(ctx, ui.error(
            'No encontré un GIF',
            `La fuente de "${meta.label || actionKey}" no respondió ahora mismo.`,
            { hint: `Detalle técnico: ${err.message}`.slice(0, 200), ephemeral: true },
        ));
    }

    // --- Texto ---
    const caption = meta.solo
        ? `${author} ${SOLO_PHRASES[actionKey] || actionName}`
        : `${author} ${meta.verb} a ${targetUser}`;

    const countLine = await buildCountLine(ctx, actionKey, author, targetUser, authorId);

    const rows = [];
    if (meta.withButtons && targetUser && targetUser.id !== authorId) {
        rows.push(consentRow(actionKey, authorId, targetUser.id));
    }

    return reply(ctx, ui.imagePayload({
        category: 'diversión',
        icon: meta.emoji,
        title: null,
        kicker: null,
        caption: countLine ? `${caption}\n\n${countLine}` : caption,
        media: { url: gif.url, description: gif.anime || gif.author || null },
        source: gif.source,
        author: gif.anime || gif.author || undefined,
        sourceUrl: gif.sourceUrl || undefined,
        rows,
    }));
}

/** Línea "-# Ryu le hizo esto a Mía 12 veces". */
async function buildCountLine(ctx, actionKey, author, targetUser, authorId) {
    if (!targetUser || targetUser.id === authorId || !ctx.guild) return '';
    try {
        const count = await incrementInteraction(ctx.guild.id, authorId, targetUser.id, actionKey);
        return `-# ${author.username} le hizo esto a ${targetUser.username} **${count}** ${count === 1 ? 'vez' : 'veces'}.`;
    } catch (err) {
        console.error('[social] No pude contar la interacción:', err.message);
        return '';
    }
}

module.exports = { executeSocialAction, consentRow };
