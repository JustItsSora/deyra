const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, warningPanel } = require('../../../lib/panel');
const { AntiNukeConfig } = require('../../../data/models');
const { invalidateCache } = require('../../../gateway/antinuke/antinukeEvents');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/antinuke toggle`.');

        const active = ctx.options.getBoolean('activo');
        const [config] = await AntiNukeConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.enabled = active;
        await config.save();
        invalidateCache(ctx.guild.id);

        if (active) {
            return reply(ctx, warningPanel('Anti-nuke activado', 'Deyra observará el audit log y cortará ráfagas de destrucción.', {
                lines: [
                    'Requisitos: el bot necesita el permiso **Ver registro de auditoría** y jerarquía por encima de los objetivos.',
                    'Modo recomendado para empezar: acción `log` (ver `/antinuke action`), y subir a `ban` o `derank` cuando confirmes que no hay falsos positivos.',
                ],
            }));
        }
        return reply(ctx, successPanel('Anti-nuke desactivado', 'La vigilancia está apagada.'));
    },
};
