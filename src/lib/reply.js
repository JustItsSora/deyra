// src/lib/reply.js
// Helper único para responder sin importar si el contexto es una Interaction (slash)
// o un Message (prefijo). Maneja el caso "ya respondido/deferido" en slash.

const { MessageFlags, MessageFlagsBitField } = require('discord.js');

function isSlash(ctx) {
    return typeof ctx.isCommand === 'function' && ctx.isCommand();
}

/**
 * Traduce la opción vieja `ephemeral: true` a la moderna `flags`.
 *
 * Discord.js v14.16 deprecó `ephemeral`: la forma oficial es mandar el bit
 * `MessageFlags.Ephemeral` dentro de `flags`. Discord.js todavía acepta lo
 * viejo, pero avisa por consola cada vez ("Supplying "ephemeral" ... is
 * deprecated"), y con ~800 respuestas efímeras por día el log queda inservible.
 *
 * Ojo con el camino de prefijo: un mensaje normal NO puede ser efímero, así
 * que ahí el bit se saca (mandarlo devuelve 400 de la API).
 *
 * @param {object} options Opciones de respuesta de discord.js.
 * @returns {object} Las mismas opciones, normalizadas.
 */
function withEphemeralFlag(options, isInteraction) {
    if (options.ephemeral) {
        // `flags` puede venir como número o como MessageFlagsBitField: se
        // normaliza a número para poder hacer el OR.
        const current = options.flags instanceof MessageFlagsBitField
            ? options.flags.bitfield
            : (options.flags ?? 0);
        options.flags = current | MessageFlags.Ephemeral;
        delete options.ephemeral;
    }
    if (!isInteraction && options.flags) {
        // Un mensaje de canal no puede llevar el bit efímero.
        options.flags = new MessageFlagsBitField(options.flags).remove(MessageFlags.Ephemeral).bitfield;
    }
    return options;
}

/**
 * @param {import('discord.js').Interaction|import('discord.js').Message} ctx
 * @param {string|object} payload - string o un objeto de opciones de discord.js
 */
async function reply(ctx, payload) {
    const options = typeof payload === 'string' ? { content: payload } : { ...payload };
    const slash = isSlash(ctx);

    withEphemeralFlag(options, slash);

    if (slash) {
        if (ctx.replied || ctx.deferred) {
            return ctx.editReply(options).catch(() => {});
        }
        return ctx.reply(options).catch(() => {});
    }

    // Message (prefijo): discord.js Message#reply no soporta `ephemeral`.
    return ctx.reply(options).catch(() => {});
}

/**
 * Responde y devuelve el MENSAJE (no el resultado crudo de la API).
 *
 * Antes esto se hacía con `fetchReply: true`, que discord.js v14.16 deprecó:
 * ahora se usa `withResponse: true`, que devuelve un InteractionCallbackResponse
 * del que hay que sacar `.resource.message`.
 *
 * @param {import('discord.js').Interaction|import('discord.js').Message} ctx
 * @param {string|object} payload
 * @returns {Promise<import('discord.js').Message|null>}
 */
async function replyAndGetMessage(ctx, payload) {
    const options = typeof payload === 'string' ? { content: payload } : { ...payload };
    const slash = isSlash(ctx);

    withEphemeralFlag(options, slash);

    if (!slash) {
        return ctx.reply(options).catch(() => null);
    }
    if (ctx.replied || ctx.deferred) {
        return ctx.editReply(options).catch(() => null);
    }
    const response = await ctx.reply({ ...options, withResponse: true }).catch(() => null);
    return response?.resource?.message || response || null;
}

/** ID del usuario que invocó, sin importar slash o prefijo. */
function getUserId(ctx) {
    return ctx.user?.id || ctx.author?.id;
}

/** Objeto User, sin importar slash o prefijo. */
function getUser(ctx) {
    return ctx.user || ctx.author;
}

/** GuildMember del invocador, si está en cache. */
function getMember(ctx) {
    return ctx.member;
}

module.exports = {
    reply, replyAndGetMessage, isSlash, getUserId, getUser, getMember,
    withEphemeralFlag,
};
