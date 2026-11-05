// src/music/events/playerCreate.js
//
// Nace un reproductor nuevo. Antes de poner un status en el canal de voz,
// aplico los ajustes del servidor (volumen, autoplay, fairplay, 24/7), porque
// este es el único punto donde el player todavía está vacío: si el admin
// cambió el volumen por defecto, tiene que valer desde la primera canción y no
// desde la segunda.
//
// El volumen es el único ajuste que NO se puede aplicar acá de verdad: Kazagumo
// manda el volumen al crear el player (va en createPlayer) y volver a mandarlo
// acá sería un update extra al nodo por cada player nuevo. Por eso los
// comandos que crean el player lo leen de la config (ver musicChecks.js,
// requireOrCreatePlayer).

const config = require('../../config');
const { getMusicConfig, applySettingsToPlayer } = require('../lib/musicConfig');

module.exports = {
    name: 'playerCreate',
    run: async (client, player) => {
        const settings = await getMusicConfig(player.guildId);
        applySettingsToPlayer(player, settings);

        const prefix = config.PREFIX;
        client.rest.put(`/channels/${player.voiceId}/voice-status`, {
            body: { status: `usa **${prefix}play** para agregar canciones` },
        }).catch(() => {});
    },
};
