// /clear — borra mensajes en masa, con filtros.
//
// Comando standalone (no subcomando de /mod) porque el flujo es distinto: antes
// de borrar hay que PODER VER qué se va a borrar, y eso es un paso aparte con su
// propio botón. Por eso tiene modo "simular".
//
// ══════════════════════════════════════════════════════════════════════════
// LO QUE DISCORD DEJA Y NO DEJA HACER (límites reales de la API, no del bot)
// ══════════════════════════════════════════════════════════════════════════
//
//  1. bulkDelete borra como máximo 100 mensajes POR LLAMADA. Para llegar a más
//     hay que ir en vueltas; este comando lo hace solo.
//
//  2. NO se puede borrar en lote nada de más de 14 días. Discord ignora esos
//     mensajes en silencio: el comando avisa cuántos se saltó.
//
//  3. ⚠️ UN BOT NO PUEDE BORRAR MENSAJES DE OTROS BOTS. Discord los salta sin
//     avisar. El filtro "solo bots" SÍ funciona, pero solo borra los mensajes
//     del propio Deyra. Esto no es una limitación de este código: es de la API,
//     y ningún bot puede esquivarla.
//
//  4. Los borrados en masa están rate-limited. Discord recomienda ~1 cada
//     5 segundos. Acá se usa 2s, que va rápido sin comerse el rate limit.
//
// ══════════════════════════════════════════════════════════════════════════

const { SlashCommandBuilder, PermissionFlagsBits, PermissionsBitField, ActionRowBuilder, ButtonBuilder, ButtonStyle, MessageFlags } = require('discord.js');
const { reply, isSlash, getUserId } = require('../../lib/reply');
const { hasPermission } = require('../../lib/permissions');
const config = require('../../config');
const ui = require('../../lib/ui');

const FOURTEEN_DAYS = 14 * 24 * 60 * 60 * 1000;
const PER_CALL = 100;          // tope duro de Discord por llamada
const BETWEEN_CALLS = 2000;    // ms entre llamadas
const MAX_TOTAL = 2000;        // tope del comando (razonable, no de Discord)

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

/** Modos de borrado, para no repetir lógica. */
const MODES = {
    todos: {
        label: 'Todos los mensajes',
        icon: '🧹',
        test: () => true,
    },
    usuario: {
        label: 'De un usuario',
        icon: '👤',
        test: (msg, ctx) => msg.author.id === ctx.userId,
    },
    bots: {
        label: 'Solo de bots',
        icon: '🤖',
        // OJO: Discord no borra los de otros bots. Este filtro sirve para
        // limpiar los del propio bot, y para mostrar cuántos son ajenos.
        test: (msg) => msg.author.bot,
    },
    humanos: {
        label: 'Solo de personas',
        icon: '🧑',
        test: (msg) => !msg.author.bot,
    },
    comandos: {
        label: 'Solo comandos',
        icon: '⌨️',
        test: (msg) => isCommand(msg, config.PREFIX),
    },
    texto: {
        label: 'Que contengan un texto',
        icon: '🔍',
        test: (msg, ctx) => msg.content.toLowerCase().includes(String(ctx.needle).toLowerCase()),
    },
    enlaces: {
        label: 'Que tengan enlaces',
        icon: '🔗',
        test: (msg) => /https?:\/\/|discord\.gg|t\.me\/|youtube\.com|youtu\.be/.test(msg.content || ''),
    },
    adjuntos: {
        label: 'Con archivos o imágenes',
        icon: '📎',
        test: (msg) => msg.attachments.size > 0,
    },
};

function isCommand(message, prefix) {
    if (message.content?.startsWith(prefix)) return true;
    return Boolean(message.interactionMetadata || message.interaction);
}

/** ¿Puede este bot borrar este mensaje, según Discord? */
function deletable(message, botId) {
    if (Date.now() - message.createdTimestamp > FOURTEEN_DAYS) return 'viejo';
    if (message.author.bot && message.author.id !== botId) return 'bot-ajeno';
    return null;
}

/**
 * Recorre el historial hacia atrás y devuelve qué se borraría (o se borró).
 * @returns {Promise<{objetivos: object[], omitidos: object[], totalRevisados: number}>}
 */
async function collect(channel, { limit, mode, userId, needle, botId, dryRun }) {
    const test = MODES[mode].test;
    const ctx = { userId, needle };
    const objetivos = [];
    const omitidos = { viejo: 0, 'bot-ajeno': 0 };
    let before;
    let revisados = 0;
    // Tope de vueltas para no quedar prendido si el filtro casi nunca matchea
    // y el canal tiene millones de mensajes.
    let vueltas = 0;

    while (objetivos.length < limit && vueltas < 60) {
        vueltas++;
        const fetched = await channel.messages.fetch({ limit: PER_CALL, before }).catch(() => null);
        if (!fetched || fetched.size === 0) break;

        before = fetched.last().id;

        // De más nuevo a más viejo: el orden de la API no está garantizado.
        const batch = [...fetched.values()].sort((a, b) => b.createdTimestamp - a.createdTimestamp);

        for (const message of batch) {
            revisados++;

            // Si ya everything en el lote es más viejo que 14 días, no hay nada
            // más útil hacia atrás: seguir es perder tiempo.
            if (Date.now() - message.createdTimestamp > FOURTEEN_DAYS) {
                omitidos.viejo++;
                continue;
            }

            const motivo = deletable(message, botId);
            if (motivo) {
                // Solo cuenta como omitido si el mensaje ERA del filtro: si no,
                // el usuario no lo pidió borrar y no viene al caso avisar.
                if (test(message, ctx)) omitidos[motivo]++;
                continue;
            }

            if (test(message, ctx)) {
                objetivos.push(message);
                if (objetivos.length >= limit) break;
            }
        }

        if (fetched.size < PER_CALL) break;
        if (dryRun) await sleep(150); // sin dry-run no hay red de por medio
    }

    return { objetivos, omitidos, totalRevisados: revisados };
}

/** Borra en lotes de 100, esperando entre llamadas. */
async function deleteInBatches(channel, messages) {
    let borrados = 0;
    let lotes = 0;
    const fallos = [];

    for (let i = 0; i < messages.length; i += PER_CALL) {
        const lote = messages.slice(i, i + PER_CALL);
        lotes++;
        try {
            const ok = await channel.bulkDelete(lote, true);
            borrados += ok.size;
        } catch (err) {
            // 403 = sin permiso en el canal. Si pasa en el primer lote, seguir
            // trying es perder tiempo: se corta.
            if (err.status === 403) {
                fallos.push('Discord me negó el permiso de borrado en este canal.');
                break;
            }
            fallos.push(err.message);
        }
        // No se espera después del último lote: no hay nada después.
        if (i + PER_CALL < messages.length) await sleep(BETWEEN_CALLS);
    }

    return { borrados, lotes, fallos };
}

/** Agrupa por autor para que el informe sea legible. */
function porAutor(messages, client) {
    const mapa = new Map();
    for (const m of messages) {
        const key = m.author.id;
        const actual = mapa.get(key) || { nombre: m.author.username, bot: m.author.bot, total: 0 };
        actual.total++;
        mapa.set(key, actual);
    }
    return [...mapa.values()].sort((a, b) => b.total - a.total);
}

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Borra mensajes en masa, con filtros y vista previa')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
        .addIntegerOption(o => o
            .setName('cantidad')
            .setDescription('Cuántos mensajes borrar como máximo (1 a 2000)')
            .setMinValue(1)
            .setMaxValue(MAX_TOTAL)
            .setRequired(true))
        .addStringOption(o => o
            .setName('modo')
            .setDescription('Qué borrar (por defecto: todo)')
            .setRequired(false)
            .addChoices(...Object.entries(MODES).map(([value, m]) => ({ name: `${m.icon} ${m.label}`.slice(0, 100), value }))))
        .addUserOption(o => o
            .setName('usuario')
            .setDescription('Sólo con modo "De un usuario"')
            .setRequired(false))
        .addStringOption(o => o
            .setName('texto')
            .setDescription('Sólo con modo "Que contengan un texto"')
            .setRequired(false))
        .addBooleanOption(o => o
            .setName('simular')
            .setDescription('Muestra qué se borraría sin borrar nada')
            .setRequired(false))
        .addBooleanOption(o => o
            .setName('confirmar')
            .setDescription('Obligatorio para borrar más de 500 de una vez (irreversible)')
            .setRequired(false)),

    name: 'clear',
    aliases: ['purge', 'limpiar', 'borrar'],
    category: 'moderación',
    cooldownMs: 5000,

    async execute(ctx, args = []) {
        const guild = ctx.guild;
        const executorId = getUserId(ctx);
        const executor = guild.members.cache.get(executorId)
            || await guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ManageMessages)) {
            return reply(ctx, ui.noPermission(
                'Necesitás el permiso **Gestionar mensajes** para borrar cosas acá.',
                { required: 'ManageMessages' },
            ));
        }

        // --- Leer los argumentos ---
        let cantidad;
        let modo = 'todos';
        let objetivoId = null;
        let texto = null;
        let simular = false;
        let confirmar = false;

        if (isSlash(ctx)) {
            cantidad = ctx.options.getInteger('cantidad');
            modo = ctx.options.getString('modo') || 'todos';
            objetivoId = ctx.options.getUser('usuario')?.id || null;
            texto = ctx.options.getString('texto');
            simular = ctx.options.getBoolean('simular') || false;
            confirmar = ctx.options.getBoolean('confirmar') || false;
        } else {
            // !clear 100 [modo] [@usuario] ["texto"] [simular] [confirmar]
            const rest = [...(args || [])];
            cantidad = parseInt(rest.shift(), 10);
            const posibles = Object.keys(MODES);
            if (rest.length && posibles.includes(rest[0].toLowerCase())) modo = rest.shift().toLowerCase();
            const mention = rest.find(a => /^<@!?\d+>$/.test(a));
            if (mention) { objetivoId = mention.replace(/[<@!>]/g, ''); rest.splice(rest.indexOf(mention), 1); }
            if (rest.length && !/^(simular|confirmar|dry|preview)$/i.test(rest[0])) {
                texto = rest.join(' ').replace(/^["']|["']$/g, '');
                rest.length = 0;
            }
            simular = rest.some(a => /^(simular|dry|preview)$/i.test(a)) || /\bsimular\b/i.test(args.join(' '));
            confirmar = rest.some(a => /^(confirmar|confirm|si|yes)$/i.test(a)) || /\bconfirmar\b/i.test(args.join(' '));
        }

        if (!cantidad || cantidad < 1 || cantidad > MAX_TOTAL) {
            return reply(ctx, ui.missingArgument(
                'Cantidad inválida',
                `Indicá cuántos mensajes borrar, entre 1 y ${MAX_TOTAL}.`,
                { usage: '/clear 100 modo:todos simular:true' },
            ));
        }

        // El modo "usuario" sin usuario, o el modo "texto" sin texto, es un error
        // de uso: mejor decirlo que borrar mensajes equivocados.
        if (modo === 'usuario' && !objetivoId) {
            return reply(ctx, ui.missingArgument(
                'Falta el usuario',
                'El modo "De un usuario" necesita saber de quién.',
                { usage: '/clear 50 modo:usuario usuario:@nombre' },
            ));
        }
        if (modo === 'texto' && !texto) {
            return reply(ctx, ui.missingArgument(
                'Falta el texto',
                'El modo de búsqueda necesita el texto a buscar.',
                { usage: '/clear 50 modo:texto texto:spam' },
            ));
        }

        const channel = ctx.channel;
        if (!channel?.messages?.fetch) {
            return reply(ctx, ui.error('Acá no se puede', 'Este canal no admite borrado de mensajes.'));
        }

        // Recorrer el canal puede tardar: se avisa antes de empezar.
        if (isSlash(ctx)) await ctx.deferReply({ flags: MessageFlags.Ephemeral});

        // Borriar mucho de una vez es IRREVERSIBLE, así que a partir de este
        // tope el comando solo simula salvo que se pase `confirmar:true`.
        // El límite está porque borrar 2000 mensajes por un typo de más
        // no tiene arreglo en Discord.
        const LIMITE_SIN_CONFIRMAR = 500;
        const requiereConfirmar = cantidad > LIMITE_SIN_CONFIRMAR && !confirmar;
        const simulado = simular || requiereConfirmar;

        let resultado;
        try {
            resultado = await collect(channel, {
                limit: cantidad,
                mode: modo,
                userId: objetivoId,
                needle: texto,
                botId: ctx.client.user.id,
                dryRun: simulado,
            });
        } catch (err) {
            console.error('[clear] Error leyendo el historial:', err);
            return reply(ctx, ui.error('No pude leer el canal', 'Falló al recorrer el historial de mensajes.', { ephemeral: true }));
        }

        const { objetivos, omitidos, totalRevisados } = resultado;

        if (!objetivos.length) {
            const callouts = [];
            if (omitidos['bot-ajeno']) {
                callouts.push({
                    tone: 'warning',
                    text: `**${omitidos['bot-ajeno']}** mensajes de otros bots no se pueden borrar: Discord no lo permite entre bots, aunque tengas el permiso.`,
                });
            }
            if (omitidos.viejo) {
                callouts.push({ tone: 'muted', text: `**${omitidos.viejo}** eran más viejos de 14 días y tampoco se pueden borrar en lote.` });
            }

            // Caso que confunde mucho: SÍ había mensajes que coincidían con el
            // filtro, pero todos estaban bloqueados. Decir "no hay nada que
            // borrar" sería mentira — hay 200 mensajes ahí y no se pueden tocar.
            const bloqueados = omitidos['bot-ajeno'] + omitidos.viejo;
            if (bloqueados > 0) {
                return reply(ctx, ui.payload({
                    category: 'moderación',
                    tone: 'warning',
                    kicker: 'Todo bloqueado',
                    title: 'Había mensajes, pero Discord no deja borrarlos',
                    icon: '🚫',
                    description: `Revisé **${totalRevisados}** mensajes del canal y **${bloqueados}** coincidían con \`${MODES[modo].label.toLowerCase()}\`, pero ninguno se puede borrar.`,
                    callouts,
                    footerText: 'Ningún bot puede borrar mensajes de otro bot: es una regla de la API de Discord.',
                }));
            }

            return reply(ctx, ui.empty(
                'No hay nada que borrar',
                `Revisé **${totalRevisados}** mensajes del canal y ninguno coincidió con \`${MODES[modo].label.toLowerCase()}\`.`,
                { hint: 'Probá con otro filtro o subí la cantidad.' },
            ));
        }

        // --- MODO SIMULAR: no borra nada ---
        if (simulado) {
            const autores = porAutor(objetivos, ctx.client);

            return reply(ctx, ui.payload({
                category: 'moderación',
                tone: 'warning',
                kicker: 'Simulación',
                title: `${ui.compact(objetivos.length)} mensajes serían borrados`,
                icon: '👁️',
                description: `No se borró nada. Este es el resultado de \`${MODES[modo].label.toLowerCase()}\` con tope ${cantidad}.`,
                stats: [
                    { label: 'A borrar', value: String(objetivos.length), icon: '🧹' },
                    { label: 'Revisados', value: String(totalRevisados), icon: '👀' },
                ],
                lists: [{
                    title: 'Por autor',
                    items: autores.slice(0, 10).map(a => `${a.bot ? '🤖' : '👤'} **${a.nombre}** — ${ui.pluralize(a.total, 'mensaje', 'mensajes')}`),
                }],
                callouts: [
                    omitidos['bot-ajeno'] ? { tone: 'warning', text: `**${omitidos['bot-ajeno']}** de otros bots quedaron fuera: Discord no deja que un bot borre mensajes de otro bot.` } : null,
                    omitidos.viejo ? { tone: 'muted', text: `**${omitidos.viejo}** eran más viejos de 14 días (límite de Discord).` } : null,
                    // El consejo tiene que decir QUÉ hacer, y depende de por qué
                    // se simuló: si pediste más de 500, repetir sin confirmar
                    // volvería a simular y el usuario nunca podría borrar.
                    requiereConfirmar
                        ? { tone: 'danger', text: `Es más de ${LIMITE_SIN_CONFIRMAR} mensajes, así que no se borra sin confirmación. Para hacerlo: \`/clear ${cantidad} modo:${modo}${objetivoId ? ` usuario:${objetivoId}` : ''}${texto ? ` texto:"${texto}"` : ''} confirmar:true\`` }
                        : { tone: 'info', text: 'Para borrar de verdad, repetí el comando sin `simular`.' },
                ].filter(Boolean),
            }));
        }

        // --- BORRAR DE VERDAD ---
        const { borrados, lotes, fallos } = await deleteInBatches(channel, objetivos);

        const autores = porAutor(objetivos, ctx.client);
        // N-1 esperas entre N lotes: después del último no se espera.
        const duracionSeg = Math.max(0, lotes - 1) * (BETWEEN_CALLS / 1000);

        return reply(ctx, ui.payload({
            category: 'moderación',
            tone: fallos.length ? 'warning' : 'success',
            kicker: 'Limpieza',
            title: `${borrados} mensajes eliminados`,
            icon: '🧹',
            description: `Modo \`${MODES[modo].label.toLowerCase()}\` en <#${channel.id}>.`,
            stats: [
                { label: 'Borrados', value: String(borrados), icon: '✅' },
                { label: 'Pedidos', value: String(cantidad), icon: '🎯' },
            ],
            meters: [{
                label: 'Completado',
                value: borrados,
                max: objetivos.length,
            }],
            lists: [{
                title: 'Por autor',
                items: autores.slice(0, 8).map(a => `${a.bot ? '🤖' : '👤'} **${a.nombre}** — ${a.total}`),
            }],
            callouts: [
                fallos.length ? { tone: 'error', text: `Algunos lotes fallaron: ${fallos.slice(0, 2).join('; ')}` } : null,
                omitidos['bot-ajeno'] ? { tone: 'warning', text: `**${omitidos['bot-ajeno']}** mensajes de otros bots no se borraron: Discord prohíbe que un bot borre mensajes de otro bot.` } : null,
                omitidos.viejo ? { tone: 'muted', text: `**${omitidos.viejo}** eran más viejos de 14 días y quedaron intactos.` } : null,
            ].filter(Boolean),
            footerText: `Ejecutado por <@${executorId}> · ${ui.pluralize(lotes, 'lote', 'lotes')} · ${duracionSeg.toFixed(0)}s de espera entre llamadas`,
        }));
    },
};
