const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const { successPanel, errorPanel } = require('../../lib/panel');
const { logModAction } = require('../../lib/modLog');
const { emoji } = require('../../lib/emojis');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('massban')
        .setDescription('Banea a varios usuarios por ID a la vez')
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
        .addStringOption(o => o.setName('ids').setDescription('IDs separados por espacio o coma').setRequired(true))
        .addStringOption(o => o.setName('razon').setDescription('Razón del baneo masivo').setRequired(false)),

    name: 'massban',
    aliases: [],
    category: 'moderación',
    cooldownMs: 5000,

    async execute(ctx, args = []) {
        const executorId = getUserId(ctx);
        const executor = ctx.guild.members.cache.get(executorId) || await ctx.guild.members.fetch(executorId).catch(() => null);
        if (!hasPermission(executor, PermissionsBitField.Flags.BanMembers)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Necesitas el permiso **Banear Miembros**.'), ephemeral: true });
        }

        let idsRaw, reason;
        if (isSlash(ctx)) {
            idsRaw = ctx.options.getString('ids');
            reason = ctx.options.getString('razon') || 'Baneo masivo';
        } else {
            idsRaw = args.join(' ');
            reason = 'Baneo masivo';
        }

        const ids = idsRaw.split(/[\s,]+/).filter(id => /^\d{17,20}$/.test(id));
        if (ids.length === 0) {
            return reply(ctx, { ...errorPanel('Sin IDs válidos', 'Proporciona al menos un ID de usuario válido.'), ephemeral: true });
        }
        if (ids.length > 30) {
            return reply(ctx, { ...errorPanel('Demasiados', 'Máximo 30 IDs por comando.'), ephemeral: true });
        }

        let banned = 0, failed = 0;
        for (const id of ids) {
            try {
                await ctx.guild.members.ban(id, { reason: `${reason} | Moderador: ${executor.user.tag}` });
                banned++;
            } catch {
                failed++;
            }
        }

        await logModAction(ctx.guild, {
            title: `${emoji('BAN')} Baneo masivo`,
            description: `**Moderador:** ${executor.user.tag}\n**Baneados:** ${banned}\n**Fallidos:** ${failed}\n**Razón:** ${reason}`,
            tone: 'error',
        });

        return reply(ctx, successPanel('Baneo masivo completado', `**Baneados:** ${banned}\n**Fallidos:** ${failed}`));
    },
};
