// src/hybrid/dumpwarns/dumpwarns.js
// NOTA DE FUSIÓN: el original de Valk consultaba PostgreSQL directo
// (`pool.query`). Deyra usa Sequelize + SQLite con un modelo Warn ya
// existente (src/data/models/Warn.js) — esta versión consulta ese modelo
// en vez de duplicar acceso a datos.
const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { reply, getMember } = require('../../lib/reply');
const { errorPanel } = require('../../lib/panel');
const { hasPermission } = require('../../lib/permissions');
const { runDump } = require('../../lib/dumpFlow');
const { Warn } = require('../../data/models');

module.exports = {
    data: new SlashCommandBuilder().setName('dumpwarns').setDescription('Exporta el historial de advertencias del servidor (te lo envía por DM)'),

    name: 'dumpwarns',
    category: 'moderación',
    cooldownMs: 10000,

    async execute(ctx) {
        const member = getMember(ctx);
        if (!hasPermission(member, PermissionsBitField.Flags.ManageGuild) && !hasPermission(member, PermissionsBitField.Flags.ModerateMembers) && !hasPermission(member, PermissionsBitField.Flags.Administrator)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitás el permiso **Gestionar Servidor**, **Moderar Miembros** o **Administrador**.'), ephemeral: true });
        }

        await runDump(ctx, {
            label: 'advertencias',
            fileKey: 'warnings',
            generate: async () => {
                const warns = await Warn.findAll({ where: { guildId: ctx.guild.id }, order: [['createdAt', 'DESC']] });

                let content;
                if (warns.length === 0) {
                    content = 'No hay advertencias registradas para este servidor.';
                } else {
                    content = `Total de advertencias: ${warns.length}\n\n${warns.map((warn, i) => `\n[Advertencia #${i + 1}]\n`
                        + `  ID de usuario: ${warn.userId}\n`
                        + `  ID de moderador: ${warn.moderatorId}\n`
                        + `  Razón: ${warn.reason || 'Sin razón especificada'}\n`
                        + `  Fecha: ${new Date(warn.createdAt).toLocaleString('es-AR')}\n`
                        + `  ID de advertencia: ${warn.id}`).join(`\n${'-'.repeat(60)}`)}`;
                }

                return { content, count: warns.length };
            },
        });
    },
};
