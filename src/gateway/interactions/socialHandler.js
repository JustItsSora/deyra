// src/gateway/interactions/socialHandler.js
// customId: "social_accept_<acción>_<quienLoHizo>_<quienLoRecibe>" o
//           "social_reject_<acción>_<quienLoHizo>_<quienLoRecibe>"
//
// Solo la persona que recibió la acción puede responder, y una vez respondida
// los botones se sustituyen por un botón deshabilitado que dice qué pasó (antes
// el mensaje entero se pisaba y se perdía el GIF original).

const { ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { getActionGif } = require('../../lib/gifApi');
const { SOCIAL_ACTIONS } = require('../../lib/socialActions');
const ui = require('../../lib/ui');

module.exports = {
    async handle(interaction) {
        const [, decision, actionKey, fromId, toId] = (interaction.customId || '').split('_');

        const meta = SOCIAL_ACTIONS[actionKey];
        if (!meta) {
            return interaction.reply({ ...ui.error('Acción desconocida', 'Ese botón ya no es válido.'), flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral}).catch(() => {});
        }

        if (interaction.user.id !== toId) {
            return interaction.reply({
                ...ui.error('No es tu botón', `Solo **${toId ? `<@${toId}>` : 'la persona mencionada'}** puede responder a esta acción.`),
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
            }).catch(() => {});
        }

        const accepted = decision === 'accept';
        const gifCategory = meta.gif || actionKey;

        // Al aceptar se manda un GIF nuevo de la MISMA acción; al rechazar no
        // hace falta (y si la API está caída no queremos que el rechazo falle).
        let gif = null;
        if (accepted) {
            gif = await getActionGif(gifCategory).catch((err) => {
                console.error(`[social] GIF no disponible para "${actionKey}":`, err.message);
                return null;
            });
        }

        const panel = ui.imagePanel({
            category: 'diversión',
            tone: accepted ? 'success' : 'neutral',
            icon: accepted ? '💚' : '🚫',
            kicker: accepted ? 'Aceptado' : 'Rechazado',
            title: accepted ? '¡Hay química!' : 'Mala suerte',
            caption: accepted
                ? `<@${toId}> aceptó ${meta.label || 'la acción'} de <@${fromId}>.`
                : `<@${toId}> rechazó ${meta.label || 'la acción'} de <@${fromId}>.`,
            media: gif ? { url: gif.url, description: gif.anime || null } : undefined,
            source: gif?.source,
            rows: [decisionRow(accepted)],
        });

        return interaction.update({ ...panel }).catch(() => {});
    },
};

/** Fila con el resultado, ya sin possibility de volver a tocar. */
function decisionRow(accepted) {
    return new ActionRowBuilder().addComponents(
        new ButtonBuilder()
            .setCustomId('social_done')
            .setLabel(accepted ? 'Aceptado' : 'Rechazado')
            .setStyle(accepted ? ButtonStyle.Success : ButtonStyle.Secondary)
            .setEmoji(accepted ? '💚' : '🚫')
            .setDisabled(true),
    );
}
