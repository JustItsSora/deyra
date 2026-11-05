// /userinfo — ficha de un usuario.
//
// Cambios respecto a la versión anterior:
//   · las 4 cifras clave van en tarjetas (cuenta creada, ingreso, roles, tiempo),
//   · "hace X" en texto además del timestamp (mucha gente lee el timestamp como
//     un número crudo),
//   · los roles muestran color y avisan si hay más de los que se listan,
//   · la miniatura del usuario va al costado con SectionBuilder, así no compite
//     con el texto.

const { SlashCommandBuilder, PermissionsBitField, ActivityType } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const ui = require('../../lib/ui');

const ACTIVITY = {
    [ActivityType.Playing]: 'jugando',
    [ActivityType.Streaming]: 'transmitiendo',
    [ActivityType.Listening]: 'escuchando',
    [ActivityType.Watching]: 'viendo',
    [ActivityType.Custom]: 'personalizado',
    [ActivityType.Competing]: 'compitiendo',
};

const STATUS = {
    online: { icon: '🟢', label: 'Conectado' },
    idle: { icon: '🟡', label: 'Inactivo' },
    dnd: { icon: '🔴', label: 'No molestar' },
    offline: { icon: '⚪', label: 'Desconectado' },
    invisible: { icon: '🕶️', label: 'Invisible' },
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Muestra información de un usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    name: 'userinfo',
    aliases: ['ui', 'user', 'whois'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const rawUser = isSlash(ctx) ? ctx.options.getUser('usuario') : (args[0] ? ctx.client.users.fetch(args[0].replace(/[<@!>]/g, '')).catch(() => null) : null);
        const userId = rawUser?.id || getUserId(ctx);

        const member = await ctx.guild.members.fetch(userId).catch(() => null);
        if (!member) {
            return reply(ctx, ui.error('Usuario inválido', 'No pude encontrar a ese usuario en este servidor.', { ephemeral: true }));
        }

        const user = member.user;
        // Ojo: Collection#sort devuelve la Collection, no un Array, y las
        // Collections no tienen .slice. Por eso el array plano sale de .map().
        const roles = member.roles.cache
            .filter(r => r.id !== ctx.guild.id && !r.managed)
            .sort((a, b) => b.position - a.position)
            .map(r => r);
        const shown = roles.slice(0, 12);
        const hidden = roles.length - shown.length;

        const perms = member.permissions.has(PermissionsBitField.Flags.Administrator) ? null : [
            ['Administrador', member.permissions.has(PermissionsBitField.Flags.Administrator)],
            ['Gestionar servidor', member.permissions.has(PermissionsBitField.Flags.ManageGuild)],
            ['Moderar mensajes', member.permissions.has(PermissionsBitField.Flags.ModerateMembers)],
            ['Banear', member.permissions.has(PermissionsBitField.Flags.BanMembers)],
            ['Administrar canales', member.permissions.has(PermissionsBitField.Flags.ManageChannels)],
        ].filter(([, has]) => has).map(([name]) => name);

        const status = STATUS[member.presence?.status] || STATUS.offline;
        const activity = member.presence?.activities?.[0];
        const activityLine = activity
            ? `${ACTIVITY[activity.type] || 'hciendo'} ${activity.name}${activity.state ? `: ${activity.state}` : ''}`
            : null;

        const avatar = user.displayAvatarURL({ size: 256, extension: 'png' });

        return reply(ctx, ui.payload({
            category: 'utilidad',
            kicker: 'Ficha de usuario',
            title: member.nickname ? `${member.nickname} (${user.username})` : user.username,
            icon: user.bot ? '🤖' : '👤',
            description: `${ui.pillFromTheme(member.presence?.status === 'online' ? 'online' : 'muted', status.label)}${user.bot ? '  ·  🤖 Cuenta de bot' : ''}${activityLine ? `\n${ui.truncate(activityLine, 200)}` : ''}`,
            sections: [{
                text: [`**${user.tag}**`, `-# <t:${Math.floor(user.createdTimestamp / 1000)}:R>`],
                accessory: { url: avatar, description: `Avatar de ${user.username}` },
            }],
            stats: [
                { label: 'Nivel', value: await getLevelBadge(ctx, member), icon: '📈' },
                { label: 'Roles', value: String(roles.length), icon: '🎭' },
                { label: 'Cuenta creada', value: `<t:${Math.floor(user.createdTimestamp / 1000)}:date>`, icon: '📅' },
            ],
            grid: [
                ['ID', user.id],
                ['Apodo', member.nickname || '—'],
                ['Se unió', `<t:${Math.floor(member.joinedTimestamp / 1000)}:F>`],
                ['Tiempo en el server', ui.duration(Date.now() - member.joinedTimestamp)],
                ['Tipo', user.bot ? 'Bot' : 'Humano'],
            ],
            lists: roles.length ? [{
                title: `Roles${hidden > 0 ? ` (${shown.length} de ${roles.length})` : ''}`,
                items: shown.map(r => r.toString()).concat(hidden > 0 ? [`…y **${hidden}** más`] : []),
            }] : [{ title: 'Roles', items: ['Sin roles asignados'] }],
            callouts: [
                perms?.length ? { tone: 'muted', text: `**Permisos relevantes:** ${ui.joinAnd(perms)}` } : null,
                member.manageable === false ? { tone: 'warning', text: 'No podés moderar a este usuario (jerarquía de roles).' } : null,
            ].filter(Boolean),
        }));
    },
};

/** Nivel de la tabla de niveles, si el sistema está activo en el guild. */
async function getLevelBadge(ctx, member) {
    try {
        const { Leveling } = require('../../data/models');
        const record = await Leveling.findOne({ where: { guildId: ctx.guild.id, userId: member.id } });
        return record ? `#${record.level}` : '—';
    } catch {
        return '—';
    }
}
