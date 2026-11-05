// src/lib/modArgs.js
// Extrae usuario objetivo, razón, y otros argumentos comunes sin importar si
// el contexto es una Interaction (slash) o un Message (prefijo con args[]).

const { isSlash } = require('./reply');

/**
 * @param {import('discord.js').Interaction|import('discord.js').Message} ctx
 * @param {string[]} args - solo se usa en modo prefijo
 * @returns {Promise<{ user: import('discord.js').User|null, member: import('discord.js').GuildMember|null, reason: string }>}
 */
async function getTargetAndReason(ctx, args) {
    if (isSlash(ctx)) {
        const user = ctx.options.getUser('usuario');
        const reason = ctx.options.getString('razon') || 'Sin razón especificada';
        const member = user ? await ctx.guild.members.fetch(user.id).catch(() => null) : null;
        return { user, member, reason };
    }

    // Modo prefijo: primer argumento es mención o ID, el resto es la razón.
    const raw = args[0];
    if (!raw) return { user: null, member: null, reason: 'Sin razón especificada' };

    const id = raw.replace(/[<@!>]/g, '');
    const member = await ctx.guild.members.fetch(id).catch(() => null);
    const user = member?.user || await ctx.client.users.fetch(id).catch(() => null);
    const reason = args.slice(1).join(' ') || 'Sin razón especificada';

    return { user, member, reason };
}

/** Devuelve un string de duración cruda ('10m', '1h') desde slash u args[1] en prefijo. */
function getDurationArg(ctx, args) {
    if (isSlash(ctx)) return ctx.options.getString('duracion');
    return args[1];
}

/** Razón cuando la duración ocupa el segundo argumento (mute/timeout). */
function getReasonAfterDuration(ctx, args) {
    if (isSlash(ctx)) return ctx.options.getString('razon') || 'Sin razón especificada';
    return args.slice(2).join(' ') || 'Sin razón especificada';
}

module.exports = { getTargetAndReason, getDurationArg, getReasonAfterDuration };
