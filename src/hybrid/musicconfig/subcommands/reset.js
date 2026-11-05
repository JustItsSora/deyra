// src/hybrid/musicconfig/subcommands/reset.js
//
// /musicconfig reset — vuelve todo a los defaults de Deyra.
//
// Borra la fila de music_configs del server, que es exactamente lo mismo que
// "volver a los defaults": el getter (src/music/lib/musicConfig.js) arma el
// objeto con los valores de config.MUSIC cuando no encuentra fila.

const { reply } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { MusicConfig } = require('../../../data/models');
const { invalidateMusicConfig } = require('../../../music/lib/musicConfig');

module.exports = {
    async execute(ctx) {
        const destroyed = await MusicConfig.destroy({ where: { guildId: ctx.guild.id } });
        invalidateMusicConfig(ctx.guild.id);

        const player = ctx.client.music?.players?.get(ctx.guild.id);
        if (player) {
            // Re-lee (ya sin fila) y lo aplica al player vivo.
            const { getMusicConfig, applySettingsToPlayer } = require('../../../music/lib/musicConfig');
            applySettingsToPlayer(player, await getMusicConfig(ctx.guild.id, { fresh: true }));
        }

        return reply(ctx, successPanel(
            'Configuración de música restablecida',
            destroyed
                ? 'Volví a los valores por defecto de Deyra.'
                : 'No había nada configurado en este servidor: ya estaba todo en default.',
            {
                lines: [
                    '**Defaults:** volumen 80%, autoplay apagado, fairplay apagado, 24/7 apagado, panel de reproducción activado.',
                    player ? 'Se aplicó al reproductor que está sonando.' : '',
                ].filter(Boolean),
            },
        ));
    },
};
