const { SlashCommandBuilder } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { infoPanel, errorPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');
const util = require('util');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('eval')
        .setDescription('[Owner] Ejecuta código JavaScript (uso interno de depuración)')
        .addStringOption(o => o.setName('codigo').setDescription('Código a ejecutar').setRequired(true)),

    name: 'eval',
    aliases: [],
    category: 'owner',

    async execute(ctx, args = []) {
        const userId = getUserId(ctx);
        if (!isOwner(userId)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Este comando es solo para el dueño del bot.'), ephemeral: true });
        }

        const code = isSlash(ctx) ? ctx.options.getString('codigo') : args.join(' ');
        if (!code) {
            return reply(ctx, { ...errorPanel('Falta el código', 'Especifica código a evaluar.'), ephemeral: true });
        }

        try {
            // eslint-disable-next-line no-eval
            let output = await eval(code);
            if (typeof output !== 'string') output = util.inspect(output, { depth: 1 });

            // Redacta el token del bot por si el output lo expone accidentalmente.
            const sanitized = output.replace(new RegExp(ctx.client.token, 'g'), '[REDACTED]');
            const truncated = sanitized.length > 1500 ? sanitized.slice(0, 1500) + '\n...(truncado)' : sanitized;

            return reply(ctx, { ...infoPanel('Eval — Resultado', `\`\`\`js\n${truncated}\n\`\`\``), ephemeral: true });
        } catch (err) {
            return reply(ctx, { ...errorPanel('Eval — Error', `\`\`\`js\n${err.message}\n\`\`\``), ephemeral: true });
        }
    },
};
