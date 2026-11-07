const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, warningPanel } = require('../../../lib/panel');
const { HoneypotConfig } = require('../../../data/models');
const { invalidateCache } = require('../../../gateway/honeypot/honeypotEvents');

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/honeypot channel`.');

        const channel = ctx.options.getChannel('canal');

        const [config] = await HoneypotConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        const changed = config.channelId !== channel.id;
        config.channelId = channel.id;
        config.enabled = true;
        await config.save();
        invalidateCache(ctx.guild.id);

        if (changed) {
            const { sendHoneypotWarning } = require('../../../lib/honeypot');
            await sendHoneypotWarning(channel, { guild: ctx.guild, action: config.action, timeoutMinutes: config.timeoutMinutes });
        }

        return reply(ctx, warningPanel('Canal señuelo asignado', `${channel} es ahora la trampa. Quien escriba ahí recibirá el castigo configurado.`, {
            lines: ['_Asegúrate de que ningún humano use ese canal: déjalo con un topic claro de "solo lectura"._'],
        }));
    },
};
