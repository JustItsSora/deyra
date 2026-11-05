// src/lib/backgroundJobs.js
// Jobs periódicos iniciados desde clientReady. Cada uno se ejecuta con guard
// contra solapamiento (isRunning) por si una corrida tarda más que el intervalo.

const cron = require('node-cron');
const { Op } = require('sequelize');
const { Reminder, Giveaway, Birthday, GuildConfig } = require('../data/models');
const { infoPanel } = require('./panel');
const { pickWinners } = require('./giveawayUtils');

function start(client) {
    startReminderJob(client);
    startGiveawayJob(client);
    startBirthdayJob(client);
    console.log('[jobs] Background jobs iniciados (recordatorios cada 30s, giveaways cada 15s, cumpleaños diario a las 09:00).');

    // El job de 24/7 vive en el módulo de música y se registra solo si hay
    // nodos de Lavalink configurados (musicManager devuelve null si no hay).
    // Vive acá y no en client.js para que todos los timers periódicos del bot
    // se inicien en el mismo lugar.
    try {
        require('../music/lib/musicJobs').startMusicJobs(client);
    } catch (err) {
        console.error('[jobs] No se pudo iniciar el job de música:', err.message);
    }
}

function startReminderJob(client) {
    let running = false;
    setInterval(async () => {
        if (running) return;
        running = true;
        try {
            const due = await Reminder.findAll({
                where: { sent: false, remindAt: { [Op.lte]: new Date() } },
                limit: 25,
            });

            for (const reminder of due) {
                try {
                    const channel = await client.channels.fetch(reminder.channelId).catch(() => null);
                    if (channel) {
                        await channel.send({
                            content: `<@${reminder.userId}>`,
                            ...infoPanel('⏰ Recordatorio', reminder.content),
                        }).catch(() => {});
                    }
                } finally {
                    reminder.sent = true;
                    await reminder.save();
                }
            }
        } catch (err) {
            console.error('[jobs] Error en reminder job:', err);
        } finally {
            running = false;
        }
    }, 30_000);
}

function startGiveawayJob(client) {
    let running = false;
    setInterval(async () => {
        if (running) return;
        running = true;
        try {
            const due = await Giveaway.findAll({
                where: { ended: false, endsAt: { [Op.lte]: new Date() } },
                limit: 10,
            });

            for (const giveaway of due) {
                await endGiveaway(client, giveaway).catch(err =>
                    console.error(`[jobs] Error finalizando giveaway ${giveaway.id}:`, err));
            }
        } catch (err) {
            console.error('[jobs] Error en giveaway job:', err);
        } finally {
            running = false;
        }
    }, 15_000);
}

async function endGiveaway(client, giveaway) {
    const entrants = JSON.parse(giveaway.entrants || '[]');
    const winners = pickWinners(entrants, giveaway.winnerCount);

    giveaway.ended = true;
    giveaway.winners = JSON.stringify(winners);
    await giveaway.save();

    const channel = await client.channels.fetch(giveaway.channelId).catch(() => null);
    if (!channel) return;

    const message = await channel.messages.fetch(giveaway.messageId).catch(() => null);

    if (winners.length === 0) {
        if (message) await message.reply(`No hubo suficientes participantes para el sorteo de **${giveaway.prize}**.`).catch(() => {});
        return;
    }

    const mentions = winners.map(id => `<@${id}>`).join(', ');
    await channel.send({
        content: mentions,
        ...infoPanel('🎉 ¡Sorteo finalizado!', `Ganador(es) de **${giveaway.prize}**: ${mentions}`),
    }).catch(() => {});
}

function startBirthdayJob(client) {
    // Corre todos los días a las 09:00 hora del servidor donde corre el proceso.
    cron.schedule('0 9 * * *', async () => {
        try {
            const today = new Date();
            const day = today.getDate();
            const month = today.getMonth() + 1;

            const birthdays = await Birthday.findAll({ where: { day, month } });
            for (const bday of birthdays) {
                try {
                    const guildConfig = await GuildConfig.findOne({ where: { guildId: bday.guildId } });
                    if (!guildConfig?.birthdayChannelId) continue;

                    const channel = await client.channels.fetch(guildConfig.birthdayChannelId).catch(() => null);
                    if (!channel) continue;

                    await channel.send({
                        content: `<@${bday.userId}>`,
                        ...infoPanel('🎂 ¡Feliz cumpleaños!', `¡Todos a felicitar a <@${bday.userId}> en su día especial!`),
                    }).catch(() => {});

                    bday.lastCelebratedYear = today.getFullYear();
                    await bday.save();
                } catch (err) {
                    console.error(`[jobs] Error celebrando cumpleaños de ${bday.userId}:`, err);
                }
            }
        } catch (err) {
            console.error('[jobs] Error en birthday job:', err);
        }
    });
}

module.exports = { start };
