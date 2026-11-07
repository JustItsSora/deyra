// src/music/lib/musicJobs.js
//
// Jobs periódicos del módulo de música.
//
// Hay UN solo job, el reviving del modo 24/7, y existe por una razón concreta:
// el player vive en memoria. Si el bot se reinicia, si Lavalink se cae y
// reconecta, o si Discord cierra la conexión de voz, el player desaparece. Con
// 24/7 activado, el canal configurado quedaría mudo hasta que alguien pasara a
// poner `/play`, que es exactamente lo contrario de lo que se pidió.
//
// El bot de música viejo hacía esto con un cron de 15 minutos por servidor, con
// un `sleep(5s)` entre servidores para no comerse el rate limit de gateway. acá
// se mantiene el intervalo de 15 minutos (no hace falta más: si el nodo se
// cayó, en 15 min va a estar de vuelta) pero sin el sleep: en Deyra el 24/7 se
// limita a lo que el server configuró, y como máximo son unos pocos servidores.
//
// Un detalle que el bot viejo tenía mal y acá se corrige: si el canal configurado
// ya no existe (lo borraron, o el bot perdió acceso), el cron desactiva el 24/7
// en vez de reintentar cada 15 minutos para siempre. Un ajuste que no se puede
// cumplir es peor que un ajuste apagado, porque el admin cree que está protegido.

const { MusicConfig } = require('../../data/models');
const { applySettingsToPlayer, settingsFromRow, defaults } = require('./musicConfig');

const CHECK_INTERVAL_MS = 15 * 60_000;

/** ¿Es un canal de voz al que el bot puede entrar? */
function isUsableVoiceChannel(channel) {
    if (!channel) return false;
    if (channel.type === 13) return true;   // voice stage
    if (channel.type === 2) return true;    // guild voice
    return typeof channel.isVoiceBased === 'function' ? channel.isVoiceBased() : false;
}

async function revive247(client, row) {
    const guild = client.guilds.cache.get(row.guildId);
    if (!guild) {
        // El bot ya no está en el server: no tiene sentido mantener el ajuste.
        await MusicConfig.update(
            { twentyFourSeven: false, voice247Id: null, text247Id: null },
            { where: { guildId: row.guildId } },
        );
        return;
    }

    const channel = await client.channels.fetch(row.voice247Id).catch(() => null);

    if (!isUsableVoiceChannel(channel)) {
        const aviso = await client.channels.fetch(row.text247Id).catch(() => null);
        if (aviso?.send) {
            await aviso.send({
                content: '⚠️ Desactivé el modo 24/7: el canal de voz que estaba configurado ya no existe o el bot no puede entrar. Si fue un error, volvé a activarlo con `/musicconfig 247 on`.',
            }).catch(() => {});
        }

        await MusicConfig.update(
            { twentyFourSeven: false, voice247Id: null, text247Id: null },
            { where: { guildId: row.guildId } },
        );
        return;
    }

    // Ya está sonando: nada que hacer. Ojo, que "exista el player" no alcanza:
    // puede estar creado pero desconectado del canal (el caso que nos duele).
    const player = client.music?.players?.get(row.guildId);
    if (player && player.state !== 'DESTROYED') {
        const settings = settingsFromRow(row, { ...defaults(), twentyFourSeven: true });

        if (player.voiceId === row.voice247Id) {
            // Sigue en el canal correcto: se re-aplica por si quedó stay247 en
            // falso (p. ej. el bot se reconectó y perdió player.data).
            applySettingsToPlayer(player, settings);
            player.data.set('stay247', true);
            return;
        }

        // Está en otro canal: moverlo es una sola op de voz. Antes se intentaba
        // crear un segundo player para el mismo guild, que falla siempre.
        try {
            player.setVoiceChannel(row.voice247Id);
            applySettingsToPlayer(player, settings);
            player.data.set('stay247', true);
            console.log(`[music] 24/7 movido a ${row.voice247Id} en ${guild.name}.`);
        } catch (err) {
            console.error(`[music] No se pudo mover el player 24/7 de ${row.guildId}:`, err.message);
        }
        return;
    }

    if (!client.music) return; // música no configurada en este arranque

    try {
        const nuevo = await client.music.createPlayer({
            guildId: row.guildId,
            voiceId: row.voice247Id,
            textId: row.text247Id || undefined,
            volume: row.defaultVolume,
            deaf: true,
        });

        // La fila ya está en mano: se mapea directo en vez de volver a
        // consultarla, y se fuerza 24/7 en true porque es lo que estamos
        // reviviendo (la fila podría haber cambiado entre medio).
        applySettingsToPlayer(nuevo, settingsFromRow(row, { ...defaults(), twentyFourSeven: true }));

        nuevo.data.set('stay247', true);
        console.log(`[music] 24/7 revivido en ${guild.name} (${row.guildId}).`);
    } catch (err) {
        // Falla de verdad (permisos, nodo caído): se avisa y NO se desactiva.
        // Un 503 de Lavalink no significa que el canal dejó de existir, y
        // apagar el 24/7 por un problema transitorio sería peor que el
        // problema.
        console.error(`[music] No se pudo revivir el 24/7 de ${row.guildId}:`, err.message);
    }
}

function startMusicJobs(client) {
    if (!client.music) {
        console.log('[music] Jobs de música no iniciados: no hay nodos de Lavalink configurados.');
        return;
    }

    let running = false;

    const run = async () => {
        if (running) return;
        running = true;
        try {
            const rows = await MusicConfig.findAll({
                where: { twentyFourSeven: true },
                limit: 50,
            });
            for (const row of rows) {
                await revive247(client, row).catch((err) =>
                    console.error(`[music] Error en 24/7 de ${row.guildId}:`, err.message));
            }
        } catch (err) {
            console.error('[music] Error en el job de 24/7:', err.message);
        } finally {
            running = false;
        }
    };

    const timer = setInterval(run, CHECK_INTERVAL_MS);
    // No mantiene el proceso vivo por sí solo: si el bot cierra, el cron se va
    // con él en vez de tener que hacer un process.exit explícito.
    timer.unref?.();

    // Primera corrida 30s después del boot: si el bot se reinició con un 24/7
    // activo, el canal queda mudo 15 minutos sin esto, que es lo que se
    // estaba quejando la gente.
    const first = setTimeout(run, 30_000);
    first.unref?.();

    console.log('[music] Job de 24/7 iniciado (cada 15 min, primera corrida a los 30s).');
}

module.exports = { startMusicJobs, CHECK_INTERVAL_MS };
