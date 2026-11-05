const { SlashCommandBuilder } = require('discord.js');
const { reply, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('shutdown')
        .setDescription('[Owner] Apaga el bot de forma segura'),

    name: 'shutdown',
    aliases: ['apagar'],
    category: 'owner',

    async execute(ctx) {
        const userId = getUserId(ctx);
        if (!isOwner(userId)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Este comando es solo para el dueño del bot.'), ephemeral: true });
        }

        await reply(ctx, successPanel('Apagando Deyra', 'El bot se apagará en unos segundos...'));

        setTimeout(async () => {
            try {
                const { sequelize } = require('../../data/models');
                await sequelize.close();
            } catch (err) {
                console.error('[shutdown] Error cerrando la DB:', err);
            }
            ctx.client.destroy();
            process.exit(0);
        }, 2000);
    },
};
