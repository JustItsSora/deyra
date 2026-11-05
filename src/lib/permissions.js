// src/lib/permissions.js
// Chequeos de permisos reales de Discord — siempre server-side, siempre dentro
// de execute(), nunca confiando solo en setDefaultMemberPermissions() (eso solo
// afecta visibilidad en la UI de slash, no protege el camino de prefijo).

const { PermissionsBitField } = require('discord.js');
const config = require('../config');

/**
 * @param {import('discord.js').GuildMember} member
 * @param {import('discord.js').PermissionResolvable} permission
 */
function hasPermission(member, permission) {
    if (!member) return false;
    return member.permissions.has(permission);
}

function isOwner(userId) {
    return userId === config.OWNER_ID;
}

/**
 * Verifica que el bot pueda actuar sobre `target` (jerarquía de roles).
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').GuildMember} target
 */
function botCanModerate(guild, target) {
    const botMember = guild.members.me;
    if (!botMember) return false;
    if (target.id === guild.ownerId) return false;
    return botMember.roles.highest.position > target.roles.highest.position;
}

/**
 * Verifica que quien ejecuta el comando tenga jerarquía suficiente sobre el objetivo.
 * @param {import('discord.js').GuildMember} executor
 * @param {import('discord.js').GuildMember} target
 */
function executorOutranks(executor, target) {
    if (executor.id === executor.guild.ownerId) return true;
    return executor.roles.highest.position > target.roles.highest.position;
}

/**
 * Devuelve el GuildMember del bot. Normalmente ya está en cache (discord.js lo
 * carga con el GUILD_CREATE), pero si no, se pide: sin esto, un chequeo de
 * permisos daría "no tengo" en un guild recién.
 * @param {import('discord.js').Guild} guild
 * @returns {Promise<import('discord.js').GuildMember|null>}
 */
async function resolveBotMember(guild) {
    if (!guild) return null;
    if (guild.members?.me) return guild.members.me;
    if (typeof guild.members?.fetchMe === 'function') {
        return guild.members.fetchMe().catch(() => null);
    }
    return null;
}

/**
 * ¿El bot tiene este permiso en el servidor?
 *
 * Discord tira 50013 (Missing Permissions) cuando la API pide algo que el rol
 * del bot no tiene. Prefiero-chequearlo acá y devolver un mensaje que diga
 * QUÉ permiso falta y dónde, en vez de un stack en la consola.
 *
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').PermissionResolvable} permission
 */
async function botHasPermission(guild, permission) {
    const me = await resolveBotMember(guild);
    if (!me) return false;
    return me.permissions.has(permission);
}

/**
 * ¿El bot tiene este permiso en un canal concreto (o en su categoría)?
 *
 * Ojo: los overwrites de la categoría pisan los del servidor. Un bot puede
 * tener "Administrar canales" a nivel servidor y no poder crearlos adentro de
 * una categoría donde tiene todo denegado.
 *
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').BaseChannel} channel
 * @param {import('discord.js').PermissionResolvable} permission
 */
async function botHasPermissionIn(guild, channel, permission) {
    const me = await resolveBotMember(guild);
    if (!me) return false;
    if (!channel || typeof channel.permissionsFor !== 'function') {
        return me.permissions.has(permission);
    }
    const resolved = channel.permissionsFor(me);
    return resolved ? resolved.has(permission) : me.permissions.has(permission);
}

/**
 * Nombre legible de un permiso (ej: "ManageChannels").
 * @param {import('discord.js').PermissionResolvable} permission
 */
function permissionName(permission) {
    const names = new PermissionsBitField(permission).toArray();
    return names.length ? names.join(', ') : String(permission);
}

/**
 * Lista de permisos que el bot NO tiene, en texto legible.
 * @param {import('discord.js').Guild} guild
 * @param {import('discord.js').BaseChannel|null} channel
 * @param {import('discord.js').PermissionResolvable[]} permissions
 * @returns {Promise<string[]>} Nombres de los permisos que faltan (vacío si tiene todos).
 */
async function missingBotPermissions(guild, channel, permissions) {
    const missing = [];
    for (const permission of permissions) {
        if (!(await botHasPermissionIn(guild, channel, permission))) {
            missing.push(permissionName(permission));
        }
    }
    return missing;
}

module.exports = {
    hasPermission, isOwner, botCanModerate, executorOutranks,
    botHasPermission, botHasPermissionIn, missingBotPermissions, permissionName,
};
