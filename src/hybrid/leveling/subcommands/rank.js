// /level rank — tarjeta de rango con barra de progreso.
//
// La barra es el cambio principal: antes el XP era un "**XP:** 340 / 500" en
// texto, y había que hacer la cuentas mentalmente. Ahora se ve cuánto falta.

const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { Leveling } = require('../../../data/models');
const { xpForLevel } = require('../../../lib/economyUtils');
const ui = require('../../../lib/ui');

module.exports = {
    async execute(ctx, args) {
        const userId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const user = await ctx.client.users.fetch(userId).catch(() => null);
        if (!user) return reply(ctx, ui.error('Usuario inválido', 'No pude encontrar a ese usuario.', { ephemeral: true }));

        const record = await Leveling.findOne({ where: { guildId: ctx.guild.id, userId } });
        if (!record) {
            return reply(ctx, ui.empty(
                `Sin datos de ${user.username}`,
                'Este usuario todavía no tiene XP registrado en este servidor.',
                { hint: 'El XP se gana enviando mensajes.' },
            ));
        }

        const needed = xpForLevel(record.level);
        // XP dentro del nivel actual: el total menos lo consumido por niveles previos.
        let remaining = Number(record.xp);
        for (let l = 0; l < record.level; l++) remaining -= xpForLevel(l);
        remaining = Math.max(0, Math.min(remaining, needed));

        const percent = ui.percent(remaining, needed);

        return reply(ctx, ui.payload({
            category: 'niveles',
            kicker: 'Rango',
            title: `Nivel ${record.level} de ${user.username}`,
            icon: '📈',
            sections: [{
                text: [
                    `**Nivel ${record.level}**${record.level > 0 ? ` · ${percent}% hacia el ${record.level + 1}` : ''}`,
                    `-# ${ui.compact(record.totalMessages)} mensajes enviados`,
                ],
                accessory: {
                    url: user.displayAvatarURL({ size: 128, extension: 'png' }),
                    description: user.username,
                },
            }],
            meters: [{
                label: 'XP al siguiente nivel',
                value: remaining,
                max: needed,
                style: 'rounded',
            }],
            grid: [
                ['XP actual', `${ui.compact(remaining)} / ${ui.compact(needed)}`],
                ['XP total', ui.compact(record.xp)],
                ['Mensajes', ui.compact(record.totalMessages)],
                ['Próximo nivel en', `${ui.compact(needed - remaining)} XP`],
            ],
            callouts: [{
                tone: 'muted',
                text: `Llegará al nivel ${record.level + 1} en unos ${estimateMessages(needed - remaining)} mensajes (si el server da 1 XP por mensaje).`,
            }],
            footerText: `El nivel se calcula sobre el XP total acumulado: ${ui.compact(record.xp)} XP.`,
        }));
    },
};

/** Estimación gruesa: cada mensaje da entre 15 y 25 XP según la config. */
function estimateMessages(missingXp) {
    const avg = 20;
    return Math.ceil(missingXp / avg);
}
