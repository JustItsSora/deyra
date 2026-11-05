// /botinfo — estado y estadísticas del bot.
//
// Este panel es el "cartel de salud" del bot, así que muestra lo que sirve para
// diagnosticar: uptime real, memoria, latencia, y el estado de los proveedores
// externos (que es lo primero que hay que mirar cuando un comando "no funciona").

const os = require('os');
const { SlashCommandBuilder, version: djsVersion } = require('discord.js');
const { reply } = require('../../lib/reply');
const config = require('../../config');
const { health } = require('../../lib/providers');
const { cacheSize } = require('../../lib/http');
const ai = require('../../lib/ai');
const ui = require('../../lib/ui');

function usedMemory() {
    const used = process.memoryUsage().heapUsed;
    return `${ui.bytes(used)} / ${ui.bytes(os.totalmem())}`;
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('botinfo')
        .setDescription(`Muestra información sobre ${config.BOT_NAME}`),

    name: 'botinfo',
    aliases: ['about', 'info'],
    category: 'utilidad',
    cooldownMs: 3000,

    async execute(ctx) {
        const client = ctx.client;
        const mem = process.memoryUsage();
        const wsPing = client.ws.ping >= 0 ? `${Math.round(client.ws.ping)}ms` : '—';
        const totalUsers = client.guilds.cache.reduce((acc, g) => acc + (g.memberCount || 0), 0);

        // Estado de los proveedores externos: la causa #1 de "un comando no
        // me funciona" es que una API gratuita se cayó.
        const providers = health();
        const offline = providers.filter(p => p.status === 'offline');

        // Estado de la IA. No hay forma de "arreglar" un 429 sin cambiar de
        // plan, así que mostrar la cuota evita que el usuario piense que el
        // bot está roto cuando en realidad se le acabaron las consultas.
        const aiQuota = ai.getQuota();
        const aiQueue = ai.queueStatus();
        const aiList = ai.configuredProviders();
        const aiCache = ai.cacheSize();

        return reply(ctx, ui.payload({
            category: 'utilidad',
            kicker: 'Acerca del bot',
            title: config.BOT_NAME,
            icon: '🤖',
            description: config.BRAND?.tagline || 'Bot todo-en-uno para Discord.',
            sections: [{
                text: [`**${client.user.tag}**`, `-# <t:${Math.floor(client.readyTimestamp / 1000)}:R>`],
                accessory: { url: client.user.displayAvatarURL({ size: 128, extension: 'png' }), description: config.BOT_NAME },
            }],
            stats: [
                { label: 'Servidores', value: ui.compact(client.guilds.cache.size), icon: '🌍' },
                { label: 'Usuarios', value: ui.compact(totalUsers), icon: '👥' },
                { label: 'Comandos', value: ui.compact(client.commands.size), icon: '⚡' },
                { label: 'Uptime', value: ui.duration(client.uptime || 0), icon: '🕐' },
                { label: 'Memoria (heap)', value: ui.bytes(mem.heapUsed), icon: '🧠' },
                { label: 'Latencia WS', value: wsPing, icon: '📡' },
            ],
            grid: [
                ['Versión', `v${require('../../../package.json').version}`],
                ['discord.js', `v${djsVersion}`],
                ['Node.js', process.version],
                ['Usuarios en cache', ui.compact(client.users.cache.size)],
                ['Prefijos cacheados', ui.compact(client.prefixCommands.size)],
                ['Base de datos', config.DATABASE_PATH],
                ['Prefijo', config.PREFIX],
            ],
            lists: aiQuota.length ? [{
                title: 'Cuota de IA',
                items: aiQuota.map(q => {
                    const estado = q.status === 'agotado' ? '🔴 agotada'
                        : (q.remaining !== null ? `🟢 ${q.remaining} libres` : '⚪ sin datos');
                    const diario = q.rpd ? ` · ${q.rpd}/día` : '';
                    return `**${q.label}** — ${estado}${diario} · ${q.used} usadas`;
                }),
            }] : undefined,
            callouts: [
                {
                    tone: offline.length ? 'warning' : 'success',
                    text: offline.length
                        ? `⚠️ ${offline.length} proveedor(es) externo(s) caídos: ${offline.map(p => p.name).join(', ')}. Esos comandos usan otro de respaldo.`
                        : '🟢 Todos los proveedores externos responden.',
                },
                {
                    tone: 'info',
                    text: aiQuota.length
                        ? `🤖 IA: ${aiList.map(p => p.label).join(' → ')} · ${aiCache} respuestas en cache${aiQueue.waiting ? ` · ${aiQueue.waiting} en cola` : ''}.`
                        : '🤖 IA: no se usó todavía. Probá `/ai hola`.',
                },
                { tone: 'muted', text: `Cache HTTP: ${cacheSize()} entradas · Node en ${os.platform()} (${os.arch()})` },
            ].filter(Boolean),
            footerText: 'Usá /botstats para el detalle de comandos por categoría.',
        }));
    },
};
