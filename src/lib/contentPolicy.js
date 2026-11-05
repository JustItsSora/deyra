// src/lib/contentPolicy.js
// Política de contenido por servidor.
//
// Deyra es SFW por defecto en TODOS los servidores. La política vive acá, en un
// solo lugar, para que ningún comando se la salte por descuido:
//
//   · Por defecto está DESHABILITADO. Un servidor nuevo nunca muestra contenido
//     adulto, ni aunque alguien instale el bot en un canal compartido.
//   · Solo un usuario con permiso de Manage Guild puede cambiarlo.
//   · Aunque esté habilitado, el contenido adulto requiere que el comando lo
//     pida explícitamente (`{ mature: true }`): no se cuela solo.
//
// Nota sobre los proveedores: hoy las 65 categorías de GIF que usa el bot son
// SFW (nekos.best y purrbot.site solo sirven SFW en los paths que usamos), así
// que el interruptor hoy no habilita nada por sí solo. Existe para que, cuando
// se conecte una fuente adulta, el gate ya esté probado y sea una decisión
// consciente de quien administra el servidor — no un descuido de código.

const { GuildConfig } = require('../data/models');

const DEFAULT_POLICY = {
    nsfw: false,
};

/** Lee la política de un servidor. Nunca tira: si la DB falla, devuelve el default. */
async function getPolicy(guildId) {
    if (!guildId) return { ...DEFAULT_POLICY };
    try {
        const config = await GuildConfig.findByPk(guildId);
        return {
            nsfw: Boolean(config?.nsfw),
        };
    } catch (err) {
        console.error('[policy] No pude leer la política:', err.message);
        return { ...DEFAULT_POLICY };
    }
}

/** true si el servidor habilitó contenido adulto. */
async function isNsfwAllowed(guildId) {
    const policy = await getPolicy(guildId);
    return policy.nsfw;
}

/**
 * Gate de contenido. Devuelve `{ allowed: false, reason }` si hay que bloquear.
 *
 * @param {import('discord.js').Interaction|import('discord.js').Message} ctx
 * @param {{mature?: boolean, command?: string}} [opts]
 *   `mature: true` marca que ESTE comando puede devolver contenido adulto.
 */
async function check(ctx, { mature = false, command } = {}) {
    if (!mature) return { allowed: true };

    const guildId = ctx.guild?.id;
    if (!guildId) return { allowed: false, reason: 'dm' };
    if (!ctx.guild) return { allowed: false, reason: 'dm' };

    const policy = await getPolicy(guildId);
    if (!policy.nsfw) return { allowed: false, reason: 'disabled', command };

    return { allowed: true };
}

/**
 * Guarda la política. Crea la fila si el servidor todavía no tiene config.
 * @param {string} guildId
 * @param {Partial<typeof DEFAULT_POLICY>} patch
 */
async function setPolicy(guildId, patch) {
    const [config] = await GuildConfig.findOrCreate({
        where: { guildId },
        defaults: { guildId, ...DEFAULT_POLICY, ...patch },
    });
    if (patch.nsfw !== undefined) config.nsfw = Boolean(patch.nsfw);
    await config.save();
    return config;
}

/** Texto para mostrar el estado actual en el panel de /nsfw. */
function describe(policy) {
    return policy.nsfw
        ? '🔓 **Habilitado** — este servidor permite contenido adulto. Sin embargo, hoy ninguna fuente activa de GIFs sirve contenido adulto, así que el cambio no altera nada visible.'
        : '🔒 **Deshabilitado** — todo el contenido del bot es apto para cualquier edad. Estado recomendado.';
}

module.exports = { getPolicy, setPolicy, isNsfwAllowed, check, describe, DEFAULT_POLICY };
