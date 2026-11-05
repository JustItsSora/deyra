// src/hybrid/musicconfig/subcommands/rol.js
//
// /musicconfig rol <@rol> — quién puede controlar la música con fairplay.
//
// Acepta @everyone como "sin rol": en ese caso el fairplay queda Inutilizable
// (no restringe a nadie) y /musicconfig fairplay on avisa de eso, en vez de
// dejar un ajuste que pareceactivo y no hace nada.

const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, warningPanel, errorPanel } = require('../../../lib/panel');
const { updateMusicConfig, getMusicConfig, applySettingsToPlayer } = require('../../../music/lib/musicConfig');

module.exports = {
    async execute(ctx, args = []) {
        const role = isSlash(ctx) ? ctx.options.getRole('rol') : null;

        // Comando de texto: !musicconfig rol @Rol  (o el id crudo)
        const rawArg = !isSlash(ctx) ? (args[0] || '').replace(/[<@>&]/g, '') : null;
        const roleId = role ? role.id : (rawArg || null);

        if (!roleId) {
            return reply(ctx, {
                ...warningPanel('Falta el rol', 'Uso: `/musicconfig rol @Rol`\nPasá `@everyone` para dejarlo sin configurar.'),
                ephemeral: true,
            });
        }

        const everyone = roleId === ctx.guild.id;

        // El rol tiene que existir: si alguien lo borró, el fairplay se
        // convertiría en un ajuste imposible de cumplir.
        if (!everyone) {
            const existe = await ctx.guild.roles.fetch(roleId).catch(() => null);
            if (!existe) {
                return reply(ctx, {
                    ...errorPanel('Ese rol no existe', 'El rol que pasaste ya no está en el servidor. Volvé a elegir uno.'),
                    ephemeral: true,
                });
            }
        }

        await updateMusicConfig(ctx.guild.id, { fairplayRoleId: everyone ? null : roleId });

        const settings = await getMusicConfig(ctx.guild.id, { fresh: true });
        const player = ctx.client.music?.players?.get(ctx.guild.id);
        if (player) applySettingsToPlayer(player, settings);

        if (everyone) {
            return reply(ctx, successPanel(
                'Rol de fairplay quitado',
                'Quedó sin rol configurado. Mientras el fairplay esté activado no va a restringir a nadie.',
                { lines: [settings.defaultFairplay ? 'Aviso: el fairplay sigue activado pero sin rol, así que no hace nada todavía.' : ''] }
                    .filter(Boolean),
            ));
        }

        return reply(ctx, successPanel(
            'Rol de fairplay actualizado',
            `A partir de ahora, solo los miembros con ${role} pueden controlar la música cuando el fairplay está activado.`,
            {
                lines: [
                    settings.defaultFairplay
                        ? 'El fairplay ya estaba activado: se aplicó al momento.'
                        : 'Para que sirva, activá el fairplay con `/musicconfig fairplay on`.',
                    'Quien tenga permiso de silenciar miembros y el owner del bot igual pueden cortar la música.',
                ],
            },
        ));
    },
};
