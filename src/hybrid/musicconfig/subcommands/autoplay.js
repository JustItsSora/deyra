// src/hybrid/musicconfig/subcommands/autoplay.js
//
// /musicconfig autoplay on|off — el default del servidor.
//
//Igual que /volume, NO pisa el player que ya está sonando: si alguien ya hizo
// /autoplay a mano, ese player sigue con lo que el usuario decidió. El default
// solo aplica a players nuevos (ver applySettingsToPlayer y la marca
// autoplaySetByUser).

const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, warningPanel } = require('../../../lib/panel');
const { updateMusicConfig, getMusicConfig } = require('../../../music/lib/musicConfig');

function parseState(ctx, args, rawSub) {
    if (isSlash(ctx)) return ctx.options.getString('estado') === 'on';
    const value = (args[0] || rawSub || '').toLowerCase();
    if (['on', 'si', 'sí', 'true', 'activar', 'enable', '1'].includes(value)) return true;
    if (['off', 'no', 'false', 'desactivar', 'disable', '0'].includes(value)) return false;
    return null;
}

module.exports = {
    async execute(ctx, args = [], { rawSub } = {}) {
        const state = parseState(ctx, args, rawSub);
        if (state === null) {
            return reply(ctx, {
                ...warningPanel('Falta el estado', 'Uso: `/musicconfig autoplay on` o `/musicconfig autoplay off`'),
                ephemeral: true,
            });
        }

        await updateMusicConfig(ctx.guild.id, { defaultAutoplay: state });
        const player = ctx.client.music?.players?.get(ctx.guild.id);

        return reply(ctx, successPanel(
            state ? 'Autoplay activado por defecto' : 'Autoplay desactivado por defecto',
            state
                ? 'Cuando la cola se termine, el bot va a seguir poniendo canciones parecidas a la última.'
                : 'Cuando la cola se termine, el bot se desconecta.',
            {
                lines: player
                    ? ['El reproductor que está sonando ahora no cambia: usá `/autoplay` para ese.']
                    : [],
            },
        ));
    },
};
