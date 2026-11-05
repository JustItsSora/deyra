// /resumir — resume los últimos mensajes de un canal.
//
// Es el comando que más justifica la IA: 100 mensajes los lee nadie, y una IA
// los lee en 2 segundos. También decide qué fechas tomar, porque resumir los
// mensajes de hace 4 meses no sirve de nada.

const { SlashCommandBuilder, ChannelType, MessageFlags } = require('discord.js');
const { reply, isSlash } = require('../../lib/reply');
const http = require('../../lib/http');
const ai = require('../../lib/ai');
const ui = require('../../lib/ui');

// Discord corta el historial a 100 por llamada. Para llegar más hay que paginar
// hacia atrás, y eso son varias requests: se acota.
const MAX_HISTORY = 200;
const FETCH_BATCH = 100;
const CUTOFF_DAYS = 30;

const SYSTEM = `Sos un resumidor de canales de Discord. Te paso los mensajes de un 
canal y devolvés un resumen útil.

Formato:
**Resumen**
Un párrafo de 2 a 4 frases con lo que realmente pasó.

**Pendientes**
- Lista de cosas sin resolver, decisiones tomadas o temas que quedaron
  abiertos. Si no hay ninguna, escribí "Nada pendiente".

Reglas:
- No inventes nada que no esté en los mensajes.
- Mencioná nombres de usuario cuando sean relevantes para entender.
- Si no hay suficiente contexto para resumir, decilo.
- Cero emojis, cero relleno.`;

module.exports = {
    data: new SlashCommandBuilder()
        .setName('resumir')
        .setDescription('Resume los mensajes recientes de un canal')
        .addChannelOption(o => o
            .setName('canal')
            .setDescription('Canal a resumir (por defecto, este)')
            .addChannelTypes(ChannelType.GuildText, ChannelType.GuildAnnouncement, ChannelType.GuildForum)
            .setRequired(false))
        .addIntegerOption(o => o
            .setName('cantidad')
            .setDescription('Cuántos mensajes mirar hacia atrás (20 a 200, por defecto 80)')
            .setMinValue(20)
            .setMaxValue(MAX_HISTORY)
            .setRequired(false))
        .addIntegerOption(o => o
            .setName('dias')
            .setDescription('Solo messages de los últimos N días (por defecto 30, máximo 90)')
            .setMinValue(1)
            .setMaxValue(90)
            .setRequired(false)),

    name: 'resumir',
    aliases: ['resumen', 'summary', 'tl;dr'],
    category: 'utilidad',
    cooldownMs: 30000, // consume cuota: un resumen cada 30s es suficiente
    // Permiso de leer mensajes: los bots que están en el canal ven el
    // historial; los que no, reciben un error claro de Discord.
    userPermissions: { messages: ['ReadMessageHistory'] },

    async execute(ctx, args = []) {
        const slash = isSlash(ctx);
        const channelRef = slash ? ctx.options.getChannel('canal') : ctx.channel;
        const amount = slash ? ctx.options.getInteger('cantidad') : parseInt(args[0], 10);
        const days = slash ? ctx.options.getInteger('dias') : parseInt(args[1], 10);

        const target = channelRef || ctx.channel;
        const limit = Math.min(Number.isFinite(amount) && amount > 0 ? amount : 80, MAX_HISTORY);
        const cutoff = Date.now() - (Number.isFinite(days) && days > 0 ? days : CUTOFF_DAYS) * 86400000;

        if (!target?.messages?.fetch) {
            return reply(ctx, ui.error(
                'No puedo resumir eso',
                'Los resúmenes solo funcionan en canales de texto. En foros o canales privados no se puede.',
            ));
        }

        // Recorrer el canal puede tardar: se avisa antes de empezar.
        if (slash) await ctx.deferReply({ flags: MessageFlags.Ephemeral});

        // --- Recolectar mensajes ---
        let mensajes = [];
        let before;
        let sinPermiso = false;

        try {
            for (let i = 0; i < Math.ceil(limit / FETCH_BATCH); i++) {
                const page = await target.messages.fetch({ limit: FETCH_BATCH, before }).catch((err) => {
                    if (err.status === 403 || err.code === 50013) sinPermiso = true;
                    return null;
                });
                if (!page || page.size === 0) break;

                before = page.last().id;
                const batch = [...page.values()]
                    .filter(m => !m.author.bot && m.createdTimestamp > cutoff && !m.system)
                    .sort((a, b) => a.createdTimestamp - b.createdTimestamp);
                mensajes.push(...batch);

                if (mensajes.length >= limit || page.size < FETCH_BATCH) break;
            }
        } catch (err) {
            console.error('[resumir] Error leyendo el canal:', err.message);
        }

        if (sinPermiso) {
            return reply(ctx, ui.error(
                'No tengo permiso',
                `No puedo leer el historial de <#${target.id}>.`,
                { hint: 'Discord oculta el historial a los bots que no pueden ver el canal. Revisá los permisos del bot en ese canal.', ephemeral: true },
            ));
        }

        if (mensajes.length < 5) {
            return reply(ctx, ui.empty(
                'No hay suficiente material',
                `Solo encontré **${mensajes.length}** mensajes de personas en <#${target.id}> en el período pedido.`,
                { hint: 'Subí la cantidad, ampliá los días, o probá en un canal más activo.' },
            ));
        }

        // Recorta a los últimos N y formatea para la IA. Los nombres de usuario
        // se cambian por "nombre1", "nombre2"… para que el modelo no invente
        // atribuciones con nombres reales.
        const recientes = mensajes.slice(-limit);
        const alias = new Map();
        const transcript = recientes.map((m) => {
            if (!alias.has(m.author.id)) alias.set(m.author.id, `user${alias.size + 1}`);
            const hora = new Date(m.createdTimestamp).toLocaleString('es-AR', {
                day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
            });
            return `[${hora}] ${alias.get(m.author.id)}: ${m.content.slice(0, 400)}`;
        }).join('\n');

        const rangoDias = Math.ceil((Date.now() - recientes[0].createdTimestamp) / 86400000);

        // --- Resumir ---
        const started = Date.now();
        let result;
        try {
            result = await ai.ask(
                `Canal: #${target.name}\nMensajes: ${recientes.length}, de los últimos ${rangoDias} día(s)\n\n${transcript}`,
                {
                    system: SYSTEM,
                    maxTokens: 700,
                    temperature: 0.4, // un resumen no necesita creatividad
                    noCache: true, // el canal cambia, no tiene sentido cachear
                    context: { channelId: target.id, guildId: ctx.guild?.id },
                },
            );
        } catch (err) {
            console.error('[resumir] IA:', err.message);
            return reply(ctx, ui.error(
                'La IA no pudo resumir',
                err.saturated
                    ? 'Todos los modelos están ocupados ahora mismo. Probá en un minuto.'
                    : 'Ninguno de los proveedores respondió.',
                { hint: `Detalle: ${err.message}`.slice(0, 200) },
            ));
        }

        // Reemplaza los alias por los nombres reales, para que el resumen sea
        // entendible por quien lo lee.
        let resumen = result.text;
        for (const [userId, nombre] of alias) {
            const user = ctx.client.users.cache.get(userId);
            if (user) {
                resumen = resumen.replace(new RegExp(`\\b${nombre}\\b`, 'g'), `@${user.username}`);
            }
        }

        const autores = [...new Set(recientes.map(m => m.author.username))];

        return reply(ctx, ui.payload({
            category: 'utilidad',
            kicker: 'Resumen de canal',
            title: `#${target.name}`,
            icon: '📋',
            description: resumen,
            stats: [
                { label: 'Mensajes', value: String(recientes.length), icon: '💬' },
                { label: 'Personas', value: String(autores.length), icon: '👥' },
                { label: 'Días', value: String(rangoDias), icon: '📅' },
            ],
            callouts: [
                { tone: 'warning', text: 'Las IA pueden omitir cosas o inventar detalles. Contrastá con el canal si la decisión es importante.' },
                { tone: 'muted', text: `Respondió ${result.providerLabel} en ${ui.duration(Date.now() - started)}.` },
            ],
            footerText: autores.slice(0, 5).join(', ') + (autores.length > 5 ? ` y ${autores.length - 5} más` : ''),
        }));
    },
};
