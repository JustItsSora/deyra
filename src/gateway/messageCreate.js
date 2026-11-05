// src/gateway/messageCreate.js
// Maneja: comandos de prefijo, notificación de AFK al mencionar a alguien,
// auto-remoción de AFK cuando el propio usuario vuelve a escribir, y sticky messages.
// El tracking de XP (leveling) y el escaneo de automod viven en sus propios
// *Events.js (gateway/leveling/, gateway/automod/) para no sobrecargar este archivo.

const config = require('../config');
const cooldown = require('../lib/cooldown');
const { errorPanel } = require('../lib/panel');
const { errorReport } = require('../lib/errorReport');
const { suggest } = require('../lib/commandSuggest');
const { Afk, StickyMessage, GuildConfig } = require('../data/models');

module.exports = {
    name: 'messageCreate',
    async execute(message, client) {
        if (message.author.bot) return;

        try {
            await handleAfkReturn(message);
            await handleAfkMentions(message);
        } catch (err) {
            console.error('[messageCreate] Error en manejo de AFK:', err);
        }

        if (message.guild) {
            try {
                await handleStickyMessage(message);
            } catch (err) {
                console.error('[messageCreate] Error en sticky message:', err);
            }
        }

        await handlePrefixCommand(message, client);
    },
};

/**
 * Responde a un comando de prefijo que no existe.
 *
 * Distingue dos casos que antes se veían iguales: el usuario se equivocó de
 * nombre (sugerimos los parecidos) o escribió algo que no es un comando.
 *
 * Ojo con `ephemeral`: es un concepto de interaction, no existe para mensajes
 * de canal. Passándolo, discord.js lo ignora silenciosamente y el panel queda
 * fijo para todos. Como este error solo le importa a quien lo escribió, se
 * borra a los 8 segundos, igual que hace handleAfkReturn más abajo.
 */
async function replyUnknownCommand(message, client, commandName, prefix) {
    // Solo los nombres canónicos, no los alias. `prefixCommands` guarda ambos
    // en la misma Collection, así que si no filtramos, "djoin" terminaba
    // sugerindo un alias interno como "dectobin" que el usuario nunca escribió.
    const canonicos = new Set([...client.prefixCommands.values()].map(c => c.name));
    const sugerencias = suggest(commandName, canonicos);

    const payload = errorPanel({
        category: 'utilidad',
        title: `No encontré el comando \`${commandName}\``,
        kicker: 'Comando desconocido',
        icon: '🔍',
        description: sugerencias.length
            ? `Seguro te quisiste decir ${sugerencias.map(s => `\`${prefix}${s}\``).join(', ')}.`
            : `El bot no tiene un comando con ese nombre. Usá \`${prefix}help\` para ver la lista.`,
        callouts: sugerencias.length
            ? [{
                tone: 'muted',
                text: `También podés usar slash commands: escribí \`/\` en el chat y Discord te autocompleta lo que hay disponible.`,
            }]
            : [{
                tone: 'muted',
                text: `El bot tiene ${client.prefixCommands.size} comandos de prefijo. Todos se escriben con \`${prefix}\` adelante.`,
            }],
    });

    const notice = await message.reply(payload).catch(() => null);
    if (notice) setTimeout(() => notice.delete().catch(() => {}), 8000);
}

async function handlePrefixCommand(message, client) {
    if (!message.guild) return; // comandos de prefijo solo en servidores

    let prefix = config.PREFIX;
    try {
        const guildConfig = await GuildConfig.findOne({ where: { guildId: message.guild.id } });
        if (guildConfig?.prefix) prefix = guildConfig.prefix;
    } catch {
        // si falla la lectura de config, seguimos con el prefijo por defecto
    }

    if (!message.content.startsWith(prefix)) return;

    const args = message.content.slice(prefix.length).trim().split(/\s+/);
    const commandName = args.shift()?.toLowerCase();
    if (!commandName) return;

    const command = client.prefixCommands.get(commandName);
    if (!command) {
        // Antes: silencio total. Si el usuario se equivoca de nombre no tenía
        // forma de saber si era un error de tipeo o el bot estaba roto.
        return replyUnknownCommand(message, client, commandName, prefix);
    }

    const userId = message.author.id;
    const remaining = cooldown.check(command.name, userId, command.cooldownMs || config.DEFAULT_COOLDOWN_MS);
    if (remaining > 0) {
        return message.reply(`Espera ${(remaining / 1000).toFixed(1)}s antes de volver a usar este comando.`).catch(() => {});
    }

    try {
        await command.execute(message, args);
    } catch (err) {
        console.error(`[messageCreate] Error ejecutando comando de prefijo "${commandName}":`, err);
        // Igual que en slash: el panel distingue error de Discord ( actionable)
        // de bug interno ( va solo a la consola).
        const notice = await message.reply(errorReport('Error', err, `!${commandName}`)).catch(() => null);
        if (notice) setTimeout(() => notice.delete().catch(() => {}), 10000);
    }
}

async function handleAfkReturn(message) {
    if (!message.guild) return;
    const entry = await Afk.findOne({ where: { guildId: message.guild.id, userId: message.author.id } });
    if (!entry) return;

    await entry.destroy();
    const notice = await message.reply({
        content: `Bienvenido/a de vuelta, ${message.author}. Te removí el estado AFK${entry.mentionCount > 0 ? ` (te mencionaron ${entry.mentionCount} vez/veces mientras estabas fuera).` : '.'}`,
    }).catch(() => null);

    if (notice) setTimeout(() => notice.delete().catch(() => {}), 8000);
}

async function handleAfkMentions(message) {
    if (!message.guild || message.mentions.users.size === 0) return;

    for (const user of message.mentions.users.values()) {
        if (user.bot) continue;
        const entry = await Afk.findOne({ where: { guildId: message.guild.id, userId: user.id } });
        if (!entry) continue;

        entry.mentionCount += 1;
        await entry.save();

        await message.reply({
            content: `${user.username} está AFK: ${entry.reason}`,
            allowedMentions: { repliedUser: false },
        }).catch(() => {});
    }
}

async function handleStickyMessage(message) {
    const sticky = await StickyMessage.findOne({ where: { channelId: message.channel.id } });
    if (!sticky) return;

    // Borra el sticky anterior (si sigue existiendo) y reenvía uno nuevo al final del canal.
    if (sticky.lastMessageId) {
        const old = await message.channel.messages.fetch(sticky.lastMessageId).catch(() => null);
        if (old) await old.delete().catch(() => {});
    }

    const sent = await message.channel.send(sticky.content).catch(() => null);
    if (sent) {
        sticky.lastMessageId = sent.id;
        await sticky.save();
    }
}
