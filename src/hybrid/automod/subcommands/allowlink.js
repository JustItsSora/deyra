const { reply, isSlash } = require('../../../lib/reply');
const { successPanel, errorPanel, infoPanel } = require('../../../lib/panel');
const { AutomodConfig } = require('../../../data/models');

function normalizeDomain(raw) {
    let input = String(raw || '').trim().toLowerCase();
    if (!input) return null;
    if (!/^[a-z0-9.-]+\.[a-z]{2,}(\/.*)?$/.test(input) && !/^https?:\/\//.test(input)) return null;
    if (/^https?:\/\//.test(input)) {
        try { input = new URL(input).hostname; } catch { return null; }
    }
    input = input.replace(/^www\./, '').replace(/\/.*$/, '');
    if (!/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/.test(input)) return null;
    return input;
}

module.exports = {
    async execute(ctx) {
        if (!isSlash(ctx)) return reply(ctx, 'Usa el slash command: `/automod allowlink`.');

        const action = ctx.options.getString('accion');
        const domainInput = ctx.options.getString('dominio');

        const [config] = await AutomodConfig.findOrCreate({ where: { guildId: ctx.guild.id }, defaults: { guildId: ctx.guild.id } });
        const list = JSON.parse(config.linkAllowlist || '[]');

        if (action === 'list') {
            const lines = list.length ? list.map(d => `· \`${d}\``) : ['Lista vacía: con anti-enlaces activo, TODO enlace se elimina.'];
            return reply(ctx, infoPanel('Dominios permitidos', 'Estos dominios pueden compartirse aunque el anti-enlaces esté activado.', { lines }));
        }

        const domain = normalizeDomain(domainInput);
        if (!domain) {
            return reply(ctx, errorPanel('Dominio inválido', 'Ejemplo válido: `youtube.com` o `https://youtu.be/abc`.'));
        }

        const idx = list.indexOf(domain);
        if (action === 'add') {
            if (idx === -1) list.push(domain);
        } else {
            if (idx === -1) return reply(ctx, errorPanel('No está en la lista', `\`${domain}\` no formaba parte de la lista.`));
            list.splice(idx, 1);
        }

        config.linkAllowlist = JSON.stringify(list);
        await config.save();

        return reply(ctx, successPanel(action === 'add' ? 'Dominio permitido' : 'Dominio eliminado',
            action === 'add'
                ? `\`${domain}\` (y sus subdominios) pueden compartirse con anti-enlaces activo.`
                : `\`${domain}\` volverá a ser eliminado con anti-enlaces activo.`));
    },
};
