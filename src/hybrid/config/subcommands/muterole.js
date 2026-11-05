const { reply, isSlash } = require('../../../lib/reply');
const { successPanel } = require('../../../lib/panel');
const { GuildConfig } = require('../../../data/models');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/config muterole`.');

        const role = ctx.options.getRole('rol');
        const [config] = await GuildConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        config.muteRoleId = role.id;
        await config.save();

        return reply(ctx, successPanel('Rol de silencio actualizado', `Se usará ${role} para silenciar manualmente.`));
    },
};
