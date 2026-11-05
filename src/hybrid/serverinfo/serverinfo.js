// /serverinfo — ficha del servidor.
//
// Antes era una lista de diez líneas "**Clave:** valor" sin alinear, que en un
// servidor con muchos canales se leía como un muro de texto. Ahora usa:
//   · tarjetas con las 4 cifras que importan (arriba, se ven de un vistazo),
//   · grilla alineada con el resto de los datos,
//   · barra del nivel de boost,
//   · ChannelsGuilds y AutomationGuilds del ícono del servidor como miniatura.

const { SlashCommandBuilder, ChannelType, GuildVerificationLevel, GuildExplicitContentFilter } = require('discord.js');
const { reply } = require('../../lib/reply');
const ui = require('../../lib/ui');

function verificationLabel(level) {
    return {
        [GuildVerificationLevel.None]: 'Sin verificación',
        [GuildVerificationLevel.Low]: 'Bajo — email verificado',
        [GuildVerificationLevel.Medium]: 'Medio — además, registrado hace 5 min',
        [GuildVerificationLevel.High]: 'Alto — además, en la lista de miembros actives',
        [GuildVerificationLevel.VeryHigh]: 'Muy alto — teléfono verificado',
    }[level] || 'Desconocido';
}

function contentFilterLabel(level) {
    return {
        [GuildExplicitContentFilter.Disabled]: 'Desactivado',
        [GuildExplicitContentFilter.MembersWithoutRoles]: 'Sin roles',
        [GuildExplicitContentFilter.AllMembers]: 'Todos',
    }[level] || '—';
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Muestra información del servidor'),

    name: 'serverinfo',
    aliases: ['si', 'server'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx) {
        const guild = ctx.guild;
        await guild.fetch().catch(() => {});

        const owner = await guild.fetchOwner().catch(() => null);
        const me = guild.members.me;

        const count = (type) => guild.channels.cache.filter(c => c.type === type).size;
        const text = count(ChannelType.GuildText);
        const voice = count(ChannelType.GuildVoice);
        const category = count(ChannelType.GuildCategory);
        const stage = count(ChannelType.GuildStageVoice);
        const forum = count(ChannelType.GuildForum);

        const roles = guild.roles.cache.size;
        const emojis = guild.emojis.cache.size;
        const stickers = guild.stickers.cache.size;
        const boostTier = guild.premiumTier || 0;
        const boosts = guild.premiumSubscriptionCount || 0;
        const iconUrl = guild.iconURL({ size: 256, extension: 'png' });

        return reply(ctx, ui.payload({
            category: 'utilidad',
            kicker: 'Ficha del servidor',
            title: guild.name,
            icon: '🌍',
            description: guild.description ? ui.truncate(guild.description, 400) : null,
            media: iconUrl ? { url: iconUrl, description: `Icono de ${guild.name}` } : null,
            stats: [
                { label: 'Miembros', value: ui.compact(guild.memberCount), icon: '👥' },
                { label: 'Canales', value: ui.compact(text + voice + category + stage + forum), icon: '💬' },
                { label: 'Roles', value: ui.compact(roles), icon: '🎭' },
                { label: 'Emojis', value: ui.compact(emojis), icon: '😀' },
                { label: 'Stickers', value: ui.compact(stickers), icon: '🏷️' },
                { label: 'Boosts', value: ui.compact(boosts), icon: '🚀' },
            ],
            grid: [
                ['Dueño', owner ? `${owner.user.username}` : '—'],
                ['ID', guild.id],
                ['Creado', `<t:${Math.floor(guild.createdTimestamp / 1000)}:date>`],
                ['Canales texto', String(text)],
                ['Canales voz', `${voice}${stage ? ` (+${stage} escenario)` : ''}`],
                ['Categorías', String(category)],
                ['Verificación', verificationLabel(guild.verificationLevel)],
                ['Filtro NSFW', contentFilterLabel(guild.explicitContentFilter)],
                ['Boost nivel', `${boostTier}/3`],
            ],
            meters: boostTier > 0 ? [{
                label: 'Nivel de boost', value: boostTier, max: 3, suffix: 'tier',
            }] : undefined,
            sections: me ? [ui.section({
                text: [
                    `Creado <t:${Math.floor(guild.createdTimestamp / 1000)}:R>`,
                    `-# Yo estoy acá desde <t:${Math.floor(me.joinedTimestamp / 1000)}:date>`,
                ],
                accessory: iconUrl
                    ? { url: guild.iconURL({ size: 128, extension: 'png' }), description: guild.name }
                    : undefined,
            })] : undefined,
        }));
    },
};
