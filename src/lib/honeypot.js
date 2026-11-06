// src/lib/honeypot.js
// Lógica compartida del honeypot: nombres señuelo, creación del canal y
// rotación periódica. La usan el gateway, el job de fondos, los comandos y
// la API admin del dashboard — una sola fuente de verdad.

const { ChannelType } = require('discord.js');

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

module.exports = { TRAP_NAMES, randomName, randomTopic, randomTrap, ensureHoneypotChannel, rotateHoneypotChannel };
