// src/lib/honeypot.js
// Lógica compartida del honeypot: nombres señuelo, creación del canal y
// rotación periódica. La usan el gateway, el job de fondos, los comandos y
// la API admin del dashboard — una sola fuente de verdad.

const { ChannelType, EmbedBuilder } = require('discord.js');

// Nombres que llaman la atención de bots de raid y scripts: prometen
// regalos/premium/sorteos. Nada de phishing real ni marcas ajenas.
const TRAP_NAMES = [
    'free-gifts', 'giveaway-now', 'premios-vip', 'nitro-gratis', 'ofertas-vip',
    'drop-especial', 'bonus-channel', 'claim-rewards', 'sorteo-vivo',
    'premios-diarios', 'regalo-premium', 'airdrop-live', 'vip-access',
    'reward-claim', 'sticker-drop', 'robux-gratis', 'drops-ahora', 'gift-center',
];

const TRAP_TOPICS = [
    'Ofertas y regalos del servidor. Canal de solo lectura: no escribas mensajes aquí.',
    'Premios exclusivos para miembros. No publiques nada en este canal.',
    'Solo lectura: reclamá tus premios en los canales oficiales, no escribas aquí.',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const randomName = () => pick(TRAP_NAMES);
const randomTopic = () => pick(TRAP_TOPICS);
const randomTrap = () => ({ name: randomName(), topic: randomTopic() });

/**
 * Crea el canal señuelo si no existe todavía o no se puede usar el actual.
 * Reutilizado por /honeypot setup, /honeypot toggle activo:true, el admin API
 * y la activación desde el dashboard con auto-creación.
 */
async function ensureHoneypotChannel(guild, { preferredName } = {}) {
    const existing = guild.channels.cache.find(c => c.name === (preferredName || 'free-gifts'));
    if (existing && existing.isTextBased?.()) return existing;

    // Evita colisiones: añade sufijo si el nombre ya está pillado.
    let name = preferredName || randomName();
    if (guild.channels.cache.some(c => c.name === name)) {
        name = `${name}-${Math.floor(Math.random() * 90 + 10)}`;
    }

    return guild.channels.create({
        name,
        type: ChannelType.GuildText,
        topic: randomTopic(),
        reason: 'Honeypot del bot Deyra',
    });
}

/**
 * Rota el nombre (y el topic) del canal señuelo. No-op silencioso si el
 * canal ya no existe o el nombre elegido coincide con el actual.
 */
async function rotateHoneypotChannel(guild, channelId) {
    const channel = await guild.channels.fetch(channelId).catch(() => null);
    if (!channel) return null;

    let candidate = randomName();
    for (let tries = 0; tries < 5 && candidate === channel.name; tries++) {
        candidate = randomName();
    }
    if (candidate === channel.name) return null;

    await channel.setName(candidate, 'Honeypot: rotación de nombre');
    await channel.setTopic(randomTopic(), 'Honeypot: rotación de topic').catch(() => {});
    return candidate;
}


// ── Aviso del señuelo ──────────────────────────────────────────────────────
// Cuando se crea o asigna el canal trampa, Deyra publica un aviso en el
// idioma del servidor: nadie debe escribir ahí, y quien lo haga recibe el
// castigo configurado automáticamente.

const WARN_TEXT = {
    es: {
        title: 'Canal señuelo — aquí no se escribe',
        desc: (p) => `Este canal existe SOLO para atrapar bots: ningún humano debería escribir aquí. Si alguien escribe, **Deyra aplicará ${p} automáticamente**.`,
        punishment: { kick: 'una expulsión', ban: 'un baneo' },
        punishTimeout: (m) => `un silencio de ${m} minutos`,
        footer: 'Deyra · honeypot',
    },
    en: {
        title: 'Decoy channel — do not write here',
        desc: (p) => `This channel exists ONLY to trap bots: no human should write here. Anyone who does gets **${p} automatically**.`,
        punishment: { kick: 'a kick', ban: 'a ban' },
        punishTimeout: (m) => `a ${m}-minute timeout`,
        footer: 'Deyra · honeypot',
    },
    de: {
        title: 'Warnkanal — hier nicht schreiben',
        desc: (p) => `Dieser Kanal existiert NUR, um Bots zu fangen. Kein Mensch sollte hier schreiben: Wer es tut, erhält automatisch **${p}**.`,
        punishment: { kick: 'einen Kick', ban: 'einen Ban' },
        punishTimeout: (m) => `ein Timeout von ${m} Minuten`,
        footer: 'Deyra · Warnkanal',
    },
    fr: {
        title: "Canal leurre — n'y écris pas",
        desc: (p) => `Ce canal existe UNIQUEMENT pour piéger les bots. Personne ne doit y écrire : sinon Deyra appliquera automatiquement **${p}**.`,
        punishment: { kick: 'un kick', ban: 'un ban' },
        punishTimeout: (m) => `un silence de ${m} minutes`,
        footer: 'Deyra · canal leurre',
    },
    pt: {
        title: 'Canal isca — não fale aqui',
        desc: (p) => `Este canal existe SÓ para pegar bots: nenhum humano deveria falar aqui. Quem falar recebe **${p} automaticamente**.`,
        punishment: { kick: 'uma expulsão', ban: 'um banimento' },
        punishTimeout: (m) => `um silêncio de ${m} minutos`,
        footer: 'Deyra · honeypot',
    },
    ru: {
        title: 'Канал-ловушка — здесь не пишите',
        desc: (p) => `Этот канал существует ТОЛЬКО для поимки ботов. Писать здесь нельзя: иначе Deyra автоматически применит **${p}**.`,
        punishment: { kick: 'кик', ban: 'бан' },
        punishTimeout: (m) => `таймаут на ${m} минут`,
        footer: 'Deyra · honeypot',
    },
};

function normalizeLang(value) {
    const v = String(value || '').toLowerCase();
    if (v.startsWith('es')) return 'es';
    if (v.startsWith('en')) return 'en';
    if (v.startsWith('de')) return 'de';
    if (v.startsWith('fr')) return 'fr';
    if (v.startsWith('pt')) return 'pt';
    if (v.startsWith('ru')) return 'ru';
    return null;
}

/** Idioma del servidor: GuildConfig.language → preferredLocale → español. */
async function detectGuildLanguage(guild) {
    try {
        const { GuildConfig } = require('../data/models');
        const row = await GuildConfig.findOne({ where: { guildId: guild.id } });
        const fromDb = normalizeLang(row?.language);
        if (fromDb) return fromDb;
    } catch (err) {
        console.error('[honeypot] No se pudo leer el idioma del servidor:', err.message);
    }
    return normalizeLang(guild?.preferredLocale) || 'es';
}

/**
 * Publica el aviso del señuelo en el canal. Falla en silencio (logea) para no
 * romper el flujo de setup/asignación si Discord está raro o no hay permisos.
 */
async function sendHoneypotWarning(channel, { guild, action = 'kick', timeoutMinutes } = {}) {
    if (!channel) return false;
    const lang = await detectGuildLanguage(guild || { id: channel.guildId });
    const t = WARN_TEXT[lang] || WARN_TEXT.es;
    const punishment = action === 'timeout'
        ? t.punishTimeout(timeoutMinutes ?? 1440)
        : (t.punishment[action] || t.punishment.kick);
    const embed = new EmbedBuilder()
        .setColor(0xf85149)
        .setTitle(t.title)
        .setDescription(t.desc(punishment))
        .setFooter({ text: t.footer });
    try {
        await channel.send({ embeds: [embed] });
        return true;
    } catch (err) {
        console.error('[honeypot] No se pudo enviar el aviso del señuelo:', err.message);
        return false;
    }
}

/** Etiqueta amigable para la frecuencia de rotación (minutos). */
function formatRotationLabel(minutes) {
    if (!minutes) return 'desactivada';
    if (minutes % 10080 === 0) return `cada ${minutes / 10080} semana(s)`;
    if (minutes % 1440 === 0) return `cada ${minutes / 1440} día(s)`;
    if (minutes % 60 === 0) return `cada ${minutes / 60} hora(s)`;
    return `cada ${minutes} minutos`;
}

module.exports = { TRAP_NAMES, randomName, randomTopic, randomTrap, ensureHoneypotChannel, rotateHoneypotChannel, sendHoneypotWarning, formatRotationLabel };
