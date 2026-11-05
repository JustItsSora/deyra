// src/gateway/automod/automodEvents.js
// Feature multi-listener: escanea cada mensaje (y cada edición) contra las
// reglas configuradas y aplica la acción configurada. Se registra vía
// { init(client) } desde eventLoader.
//
// Protecciones:
//   · invitaciones Discord (incl. discord.com/invite, dsc.gg, invite.gg)
//   · enlaces genéricos, con allowlist de dominios configurable
//   · menciones masivas (usuarios + roles + @everyone/@here)
//   · mayúsculas excesivas
//   · palabras prohibidas (match por límites de palabra, menos falsos positivos)
//   · spam por frecuencia y por contenido duplicado
//   · escalada: N advertencias en 30 días → timeout / kick / ban automático

const { PermissionsBitField } = require('discord.js');
const { Op } = require('sequelize');
const { AutomodConfig } = require('../../data/models');
const { logModAction } = require('../../lib/modLog');
const { emoji } = require('../../lib/emojis');
const { botCanModerate } = require('../../lib/permissions');
const ai = require('../../lib/ai');
const aiMod = require('../../lib/aiModeration');

const INVITE_REGEX = /(discord(app)?\.(gg|io|me|li)|discord\.com\/invite|dsc\.gg|invite\.gg)\/[\w-]+/i;
const LINK_REGEX = /https?:\/\/[^\s]+/gi;

// Ventanas de spam en memoria: `${guildId}:${userId}` -> [{ t, hash }]
const spamTracker = new Map();

const MAX_TRACKED_KEYS = 8000;
const DUPLICATE_LIMIT = 3;      // mismo contenido N veces dentro de la ventana = spam
const ESCALATION_WINDOW_DAYS = 30;

function init(client) {
    // Barrera periódica: borra claves vacías para que el mapa no crezca sin
    // límite en servidores grandes o bajo raid.
    const sweeper = setInterval(() => {
        const now = Date.now();
        for (const [key, entries] of spamTracker) {
            const alive = entries.filter(e => now - e.t < 10 * 60 * 1000);
            if (alive.length === 0) spamTracker.delete(key);
            else spamTracker.set(key, alive);
        }
    }, 5 * 60 * 1000);
    sweeper.unref?.();

    client.on('messageCreate', async (message) => {
        if (message.author.bot || !message.guild) return;

        try {
            await scanMessage(message, { edited: false });
        } catch (err) {
            console.error('[automod] Error escaneando mensaje:', err);
        }
    });

    // Un mensaje editado puede volverse una infracción después del envío.
    client.on('messageUpdate', async (oldMessage, newMessage) => {
        if (!newMessage.guild) return;
        if (newMessage.partial) {
            newMessage = await newMessage.fetch().catch(() => null);
            if (!newMessage) return;
        }
        if (newMessage.author?.bot) return;
        if (oldMessage.content === newMessage.content) return; // sin cambio de texto

        try {
            await scanMessage(newMessage, { edited: true });
        } catch (err) {
            console.error('[automod] Error escaneando edición:', err);
        }
    });
}

async function scanMessage(message, { edited }) {
    const config = await AutomodConfig.findOne({ where: { guildId: message.guild.id } });
    if (!config || !config.enabled) return;

    const member = message.member;
    if (!member) return;

    // No aplica a quienes pueden gestionar el servidor, ni a canales/roles en whitelist.
    if (member.permissions.has(PermissionsBitField.Flags.ManageGuild)) return;

    const whitelistedChannels = JSON.parse(config.whitelistedChannels || '[]');
    if (whitelistedChannels.includes(message.channel.id)) return;

    const whitelistedRoles = JSON.parse(config.whitelistedRoles || '[]');
    if (member.roles.cache.some(r => whitelistedRoles.includes(r.id))) return;

    let violation = null;

    if (config.antiInvite && INVITE_REGEX.test(message.content)) {
        violation = 'Enlace de invitación de Discord';
    } else if (config.antiLink && hasDisallowedLink(message.content, JSON.parse(config.linkAllowlist || '[]'))) {
        violation = 'Enlace no permitido';
    } else if (config.antiMention) {
        const mentioned = totalMentions(message);
        if (mentioned >= config.maxMentions) {
            violation = `Mención masiva (${mentioned} menciones)`;
        }
    } else if (config.antiCaps && isExcessiveCaps(message.content, config.capsPercentThreshold)) {
        violation = 'Uso excesivo de mayúsculas';
    } else if (config.antiBadWords && containsBadWord(message.content, JSON.parse(config.badWordsList || '[]'))) {
        violation = 'Palabra prohibida';
    } else if (config.antiSpam && !edited && isSpamming(message, config.spamMessageCount, config.spamIntervalSeconds)) {
        violation = 'Spam de mensajes';
    }

    if (!violation) return;

    // ─────────────────────────────────────────────────────────────────────────
    // IA: segunda opinión, SOLO sobre las reglas que pueden ser falsos positivos.
    //
    // Un filtro de palabras no entiende contexto: "hijo de puta madre" en un
    // chiste, un insulto citado de una película o una palabra prohibida en
    // medio de una frase inocente disparan la alarma igual que una amenaza real.
    //
    // La IA revisa esas. Si dice que es falso positivo, el mensaje sobrevive y
    // el resto de las reglas siguen como siempre. Si confirma con gravedad
    // alta, se aplica la punishment normal. Y si hay duda, se escala a un
    // humano por el canal de logs.
    //
    // Nunca se llama a la IA para las reglas objetivas (invites, menciones
    // masivas): un regex acierta siempre y una IA no puede mejorarlo.
    // ─────────────────────────────────────────────────────────────────────────
    const revisable = ['Palabra prohibida', 'Uso excesivo de mayúsculas'];
    let veredicto = null;

    if (config.aiModeration && ai.isConfigured() && revisable.includes(violation)) {
        veredicto = await aiMod.analyze(message.content, { reason: violation });
    }

    // Falso positivo confirmado por la IA: no se toca el mensaje.
    if (veredicto?.esFalsoPositivo) {
        if (config.logChannelId) {
            await logModAction(message.guild, {
                title: `${emoji('EYE')} Automod: falso positivo`,
                description: `**Usuario:** ${member.user.tag}\n**Regla:** ${violation}\n**IA:** ${aiMod.describe(veredicto)} (${veredicto.provider})\n**Contenido:** ${message.content.slice(0, 200)}\n\n_El mensaje NO fue eliminado._`,
                tone: 'info',
            }).catch(() => {});
        }
        return;
    }

    await message.delete().catch(() => {});

    // Violación confirmada y grave: el castigo es el de siempre.
    if (veredicto && aiMod.shouldAutoAct(veredicto)) {
        violation = `${violation} — confirmado por IA: ${veredicto.tipo || 'sin clasificar'} (${veredicto.gravedad}/10)`;
    }

    await applyPunishment(message, config, violation, veredicto);
}

function totalMentions(message) {
    const users = message.mentions?.users?.size || 0;
    const roles = message.mentions?.roles?.size || 0;
    const everyone = message.mentions?.everyone ? 1 : 0;
    return users + roles + everyone;
}

function isExcessiveCaps(content, thresholdPercent) {
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length < 10) return false; // ignora mensajes cortos
    const caps = letters.replace(/[^A-Z]/g, '');
    return (caps.length / letters.length) * 100 >= thresholdPercent;
}

// Extrae los hosts de todos los enlaces del contenido y devuelve true si hay
// al menos uno que no está en la allowlist. Sin enlaces → false.
function hasDisallowedLink(content, allowlist) {
    const matches = content.match(LINK_REGEX);
    if (!matches) return false;

    const allowed = (host) => allowlist.some(domain => host === domain || host.endsWith(`.${domain}`));

    for (const raw of matches) {
        let host;
        try {
            host = new URL(raw).hostname.replace(/^www\./, '').toLowerCase();
        } catch {
            continue; // URL rota: que la decida el resto de reglas, no bloqueamos de más
        }
        if (!allowed(host)) return true;
    }
    return false;
}

// Match por límites de palabra para reducir falsos positivos tipo "class"
// conteniendo "ass". Para términos que no son alnum puro (con símbolos o
// espacios) se cae al includes de toda la vida.
function containsBadWord(content, badWords) {
    if (badWords.length === 0) return false;
    const lower = content.toLowerCase();

    return badWords.some(word => {
        const w = String(word).toLowerCase().trim();
        if (!w) return false;
        if (/^[a-z0-9]+$/i.test(w)) {
            const re = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(w)}(?![\\p{L}\\p{N}])`, 'iu');
            return re.test(lower);
        }
        return lower.includes(w);
    });
}

function escapeRegExp(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeForHash(content) {
    return content.toLowerCase().replace(/\s+/g, ' ').trim();
}

function hashString(s) {
    let h = 0;
    for (let i = 0; i < s.length; i++) {
        h = (h * 31 + s.charCodeAt(i)) | 0;
    }
    return h;
}

function isSpamming(message, maxMessages, intervalSeconds) {
    const key = `${message.guild.id}:${message.author.id}`;
    const now = Date.now();
    const windowMs = intervalSeconds * 1000;

    if (spamTracker.size >= MAX_TRACKED_KEYS && !spamTracker.has(key)) {
        for (const k of spamTracker.keys()) {
            spamTracker.delete(k);
            if (spamTracker.size < MAX_TRACKED_KEYS) break;
        }
    }

    const entries = (spamTracker.get(key) || []).filter(e => now - e.t < windowMs);
    entries.push({ t: now, hash: hashString(normalizeForHash(message.content || '')) });

    if (entries.length === 0) spamTracker.delete(key);
    else spamTracker.set(key, entries);

    if (entries.length >= maxMessages) return true;

    // Mismo contenido repetido: clásico de bots de raid.
    const counts = new Map();
    for (const e of entries) counts.set(e.hash, (counts.get(e.hash) || 0) + 1);
    for (const count of counts.values()) {
        if (count >= DUPLICATE_LIMIT) return true;
    }
    return false;
}

async function applyPunishment(message, config, violationReason, veredicto = null) {
    const member = message.member;
    const action = config.punishmentAction;

    await message.channel.send({
        content: `${emoji('WARNING')} ${member}, tu mensaje fue eliminado: **${violationReason}**.`,
    }).then(m => setTimeout(() => m.delete().catch(() => {}), 6000)).catch(() => {});

    const { Warn } = require('../../data/models');

    // Toda infracción queda en el historial: lo usa la escalada y lo ve un
    // moderador con /warnings. Sin esto, la escalada solo contaría las
    // advertencias manuales y llegaría tarde.
    await Warn.create({
        guildId: message.guild.id,
        userId: member.id,
        moderatorId: message.client.user.id,
        reason: `Automod: ${violationReason}`,
    }).catch(() => {});

    try {
        if (action === 'mute' && botCanModerate(message.guild, member)) {
            await member.timeout(10 * 60 * 1000, `Automod: ${violationReason}`);
        } else if (action === 'kick' && botCanModerate(message.guild, member)) {
            await member.kick(`Automod: ${violationReason}`);
        } else if (action === 'ban' && botCanModerate(message.guild, member)) {
            await member.ban({ reason: `Automod: ${violationReason}` });
        }
        // 'warn' y 'delete' no necesitan acción adicional: el Warn ya quedó registrado.
    } catch (err) {
        console.error('[automod] Error aplicando castigo:', err);
    }

    await maybeEscalate(message, config, violationReason);

    if (config.logChannelId) {
        await logModAction(message.guild, {
            title: `${emoji('SHIELD')} Automod: ${violationReason}`,
            description: [
                `**Usuario:** ${member.user.tag} (${member.id})`,
                `**Canal:** ${message.channel}`,
                `**Acción:** \`${action}\``,
                veredicto ? `**IA:** ${aiMod.describe(veredicto)} (${veredicto.provider})` : null,
                `**Contenido:** ${message.content.slice(0, 200)}`,
            ].filter(Boolean).join('\n'),
            tone: 'warning',
        });
    }
}

async function maybeEscalate(message, config, violationReason) {
    const escalation = config.escalationAction;
    if (!escalation || escalation === 'off') return;

    // Si el castigo base ya expulsó/baneó al usuario, escalar no tiene sentido.
    if (['kick', 'ban'].includes(config.punishmentAction)) return;

    const member = message.member;
    if (!botCanModerate(message.guild, member)) return;

    const { Warn } = require('../../data/models');
    const since = new Date(Date.now() - ESCALATION_WINDOW_DAYS * 24 * 60 * 60 * 1000);
    const count = await Warn.count({
        where: { guildId: message.guild.id, userId: member.id, createdAt: { [Op.gte]: since } },
    }).catch(() => 0);

    if (count < config.escalationThreshold) return;

    const reason = `Automod escalada: ${count} infracciones en ${ESCALATION_WINDOW_DAYS} días`;
    try {
        if (escalation === 'timeout') {
            await member.timeout(60 * 60 * 1000, reason);
        } else if (escalation === 'kick') {
            await member.kick(reason);
        } else if (escalation === 'ban') {
            await member.ban({ reason });
        } else {
            return;
        }

        await logModAction(message.guild, {
            title: `${emoji('SHIELD')} Automod: escalada (${escalation})`,
            description: [
                `**Usuario:** ${member.user.tag} (${member.id})`,
                `**Infracciones en ${ESCALATION_WINDOW_DAYS} días:** ${count} (umbral ${config.escalationThreshold})`,
                `**Motivo final:** ${violationReason}`,
            ].join('\n'),
            tone: 'error',
        });
    } catch (err) {
        console.error('[automod] Error aplicando escalada:', err);
    }
}

module.exports = { init };
