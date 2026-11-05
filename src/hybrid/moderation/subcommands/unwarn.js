const { PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { Warn } = require('../../../data/models');

module.exports = {
    async execute(ctx, args) {
        const guild = ctx.guild;
        const executorId = getUserId(ctx);
        const executor = guild.members.cache.get(executorId) || await guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ModerateMembers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Moderar Miembros**.'), ephemeral: true });
        }

        const warnId = isSlash(ctx) ? ctx.options.getInteger('id') : parseInt(args[0], 10);
        if (!warnId || Number.isNaN(warnId)) {
            return reply(ctx, { ...errorPanel('ID inválido', 'Proporciona el ID numérico de la advertencia (usa `/mod warnings` para verlos).'), ephemeral: true });
        }

        const warn = await Warn.findOne({ where: { id: warnId, guildId: guild.id } });
        if (!warn) {
            return reply(ctx, { ...errorPanel('No encontrada', 'No hay ninguna advertencia con ese ID en este servidor.'), ephemeral: true });
        }

        await warn.destroy();
        return reply(ctx, successPanel('Advertencia eliminada', `Se eliminó la advertencia #${warnId}.`));
    },
};
