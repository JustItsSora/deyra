const { SlashCommandBuilder } = require('discord.js');
const path = require('path');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { successPanel, errorPanel } = require('../../lib/panel');
const { isOwner } = require('../../lib/permissions');
const { loadHybridCommands, loadSlashCommands, loadPrefixCommands } = require('../../lib/commandLoader');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('reload')
        .setDescription('[Owner] Recarga los comandos sin reiniciar el bot'),

    name: 'reload',
    aliases: ['recargar'],
    category: 'owner',

    async execute(ctx) {
        const userId = getUserId(ctx);
        if (!isOwner(userId)) {
            return reply(ctx, { ...errorPanel('Sin permisos', 'Este comando es solo para el dueño del bot.'), ephemeral: true });
        }

        const client = ctx.client;

        try {
            // Limpia la cache de require para todos los archivos de comandos, y recarga.
            const srcDir = path.join(__dirname, '..', '..');
            Object.keys(require.cache).forEach((key) => {
                if (key.startsWith(path.join(srcDir, 'hybrid')) || key.startsWith(path.join(srcDir, 'commands'))) {
                    delete require.cache[key];
                }
            });

            client.commands.clear();
            client.prefixCommands.clear();

            loadHybridCommands(client, path.join(srcDir, 'hybrid'));
            loadSlashCommands(client, path.join(srcDir, 'commands', 'slash'));
            loadPrefixCommands(client, path.join(srcDir, 'commands', 'prefix'));

            const { registerCommands } = require('../../lib/registerCommands');
            await registerCommands(client);

            return reply(ctx, successPanel('Comandos recargados', `${client.commands.size} slash commands, ${client.prefixCommands.size} entradas de prefijo.`));
        } catch (err) {
            console.error('[reload] Error:', err);
            return reply(ctx, { ...errorPanel('Error', `No pude recargar los comandos: ${err.message}`), ephemeral: true });
        }
    },
};
