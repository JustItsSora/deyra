// src/hybrid/musicconfig/subcommands/volumen.js
//
// /musicconfig volumen <0-100> — el volumen con el que ARRANCA el reproductor.
//
// No cambia el volumen del player que ya está sonando: para eso está /volume y
// los botones del panel. Esto es el default para los próximos players, que es
// distinto a propósito (si no, un admin que ajusta el volumen a mitad de una
// canción se lo cambia de golpe al que está escuchando otra persona).

const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, warningPanel, errorPanel } = require('../../../lib/panel');
const { updateMusicConfig } = require('../../../music/lib/musicConfig');
const { clampVolume } = require('../../../music/lib/musicChecks');
const config = require('../../../config');

module.exports = {
    async execute(ctx, args = [], { rawSub } = {}) {
        const raw = isSlash(ctx) ? ctx.options.getInteger('nivel') : Number(args[0]);
        const actual = raw ?? (rawSub === 'volumen' ? args[0] : undefined);

        if (actual === undefined || actual === null || Number.isNaN(Number(actual))) {
            return reply(ctx, {
                ...warningPanel('Falta el volumen', 'Uso: `/musicconfig volumen <0-100>`'),
                ephemeral: true,
            });
        }

        const value = clampVolume(Number(actual));
        const defaultActual = config.MUSIC.DEFAULT_VOLUME;

        // El slash ya acota 0-100; el comando de texto no, así que el recorte
        // se avisa en vez de corregirse en silencio.
        if (value !== Number(actual)) {
            return reply(ctx, {
                ...warningPanel('Fuera de rango', `\`${actual}\` no es un volumen válido. Va de 0 a 100.`),
                ephemeral: true,
            });
        }

        await updateMusicConfig(ctx.guild.id, { defaultVolume: value });

        return reply(ctx, successPanel(
            'Volumen por defecto actualizado',
            `Los próximos reproductores de este servidor arrancan en \`${value}%\`.`,
            { lines: [`El reproductor que esté sonando ahora no cambia: usá \`/volume ${value}\` para eso.`] },
        ));
    },
};
