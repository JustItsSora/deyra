const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel } = require('../../../lib/panel');
const { AutomodConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/automod whitelist`.');

        const type = ctx.options.getString('tipo');
        const action = ctx.options.getString('accion');
        const target = ctx.options.getMentionable('objetivo');

        if (!target) {
            return reply(ctx, { ...errorPanel('Falta el objetivo', 'Menciona un canal o rol.'), ephemeral: true });
        }

        const [config] = await AutomodConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        const field = type === 'channel' ? 'whitelistedChannels' : 'whitelistedRoles';
        const list = JSON.parse(config[field] || '[]');

        if (action === 'add') {
            if (!list.includes(target.id)) list.push(target.id);
        } else {
            const idx = list.indexOf(target.id);
            if (idx !== -1) list.splice(idx, 1);
        }

        config[field] = JSON.stringify(list);
        await config.save();

        return reply(ctx, successPanel('Whitelist actualizada', `${type === 'channel' ? 'Canal' : 'Rol'} ${action === 'add' ? 'añadido a' : 'quitado de'} la whitelist.`));
    },
};
