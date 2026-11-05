// src/hybrid/musicconfig/subcommands/fairplay.js
//
// /musicconfig fairplay on|off — fairplay.
//
// Qué es fairplay, en una línea: el bot sigue reproduciendo para todo el
// servidor, pero SOLO los miembros con el rol configurado pueden cambiar lo que
// suena. Sirve para servidores con horario o con DJ titration: la música sigue
// viva de noche, pero nadie que entre al canal puede cambiar la lista.
//
// En el bot de música viejo el fairplay además reordenaba la cola round-robin
// por quien pidió cada canción. Eso acá no se hace: con Kazagumo la cola es un
// Array y no hay un punto único por el que pasan todas las altas, así que
// reordinar de forma confiable implicaría tocar cada comando de reproducción.
// Se elige el control de acceso, que es lo que la gente realmente pide, y se
// deja la cola en orden de llegada (FIFO), que además es lo más justo.

const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, warningPanel, errorPanel } = require('../../../lib/panel');
const { updateMusicConfig, getMusicConfig, applySettingsToPlayer } = require('../../../music/lib/musicConfig');

function parseState(ctx, args) {
    if (isSlash(ctx)) return ctx.options.getString('estado') === 'on';
    const value = (args[0] || '').toLowerCase();
    if (['on', 'si', 'sí', 'true', 'activar', 'enable', '1'].includes(value)) return true;
    if (['off', 'no', 'false', 'desactivar', 'disable', '0'].includes(value)) return false;
    return null;
}

module.exports = {
    async execute(ctx, args = []) {
        const state = parseState(ctx, args);
        if (state === null) {
            return reply(ctx, {
                ...warningPanel('Falta el estado', 'Uso: `/musicconfig fairplay on` o `/musicconfig fairplay off`'),
                ephemeral: true,
            });
        }

        if (state) {
            const settings = await getMusicConfig(ctx.guild.id, { fresh: true });
            if (!settings.fairplayRoleId) {
                return reply(ctx, {
                    ...errorPanel(
                        'Falta el rol',
                        'El fairplay sin rol configurado no restringe a nadie, así que no tiene sentido activarlo todavía.\nUsá `/musicconfig rol` primero.',
                    ),
                    ephemeral: true,
                });
            }
        }

        await updateMusicConfig(ctx.guild.id, { defaultFairplay: state });

        // Si hay música sonando, el player tiene que enterarse ya: si no, el
        // fairplay recién valdría en el próximo player.
        const player = ctx.client.music?.players?.get(ctx.guild.id);
        if (player) {
            const settings = await getMusicConfig(ctx.guild.id, { fresh: true });
            applySettingsToPlayer(player, settings);
        }

        return reply(ctx, successPanel(
            state ? 'Fairplay activado' : 'Fairplay desactivado',
            state
                ? 'A partir de ahora solo los miembros del rol configurado pueden pausar, saltar, cambiar el volumen o poner filtros. Todos siguen escuchando.'
                : 'Cualquiera en el canal de voz vuelve a controlar la música.',
            { lines: [player ? 'Se aplicó al reproductor que ya está sonando.' : 'Se aplicará al próximo reproductor que se cree.'] },
        ));
    },
};
