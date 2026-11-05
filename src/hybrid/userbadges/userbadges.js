const { SlashCommandBuilder, UserFlagsBitField } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');

const BADGE_NAMES = {
    Staff: 'Empleado de Discord',
    Partner: 'Socio de Discord',
    Hypesquad: 'HypeSquad Events',
    BugHunterLevel1: 'Cazador de bugs',
    BugHunterLevel2: 'Cazador de bugs (nivel 2)',
    HypeSquadOnlineHouse1: 'Casa Bravery',
    HypeSquadOnlineHouse2: 'Casa Brilliance',
    HypeSquadOnlineHouse3: 'Casa Balance',
    PremiumEarlySupporter: 'Apoyo temprano',
    VerifiedDeveloper: 'Desarrollador verificado de bots',
    CertifiedModerator: 'Moderador certificado',
    ActiveDeveloper: 'Desarrollador activo',
};

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userbadges')
        .setDescription('Muestra las insignias de perfil de Discord de un usuario')
        .addUserOption(o => o.setName('usuario').setDescription('Usuario a consultar').setRequired(false)),

    name: 'userbadges',
    aliases: ['insignias'],
    category: 'utilidad',
    cooldownMs: 2000,

    async execute(ctx, args = []) {
        const userId = isSlash(ctx) ? (ctx.options.getUser('usuario')?.id || getUserId(ctx)) : (args[0]?.replace(/[<@!>]/g, '') || getUserId(ctx));
        const user = await ctx.client.users.fetch(userId, { force: true }).catch(() => null);

        if (!user) {
            return reply(ctx, { ...errorPanel('Usuario inválido', 'No pude encontrar a ese usuario.'), ephemeral: true });
        }

        const flags = user.flags?.toArray() || [];
        if (flags.length === 0) {
            return reply(ctx, infoPanel(`Insignias de ${user.username}`, 'Este usuario no tiene insignias especiales.'));
        }

        const names = flags.map(f => BADGE_NAMES[f] || f);
        return reply(ctx, infoPanel(`Insignias de ${user.username}`, names.join(', ')));
    },
};
