// /automod aifilter — segunda opinión con IA para las reglas de palabras.
//
// Qué hace y qué NO hace, porque es la diferencia entre útil y molesto:
//
//   · SÍ: revisa los mensajes que dispararon "palabra prohibida" o "mayúsculas"
//     y decide si eran falsos positivos (una cita, una broma, el nombre de una
//     película). Si lo son, el mensaje sobrevive y queda registrado.
//   · NO: no toca las reglas objetivas (invites, enlaces, menciones masivas).
//     Ahí un regex acierta siempre y una IA solo gastaría cuota.
//   · NO: no borra por su cuenta salvo que la gravedad sea 8 o más. Antes de
//     esa confianza, decide un humano.
//
// Gasta cuota de IA, así que viene apagado por defecto.

const { SlashCommandBuilder, PermissionFlagsBits } = require('discord.js');
const { reply, isSlash } = require('../../../lib/reply');
const { hasPermission } = require('../../../lib/permissions');
const { PermissionsBitField } = require('discord.js');
const { AutomodConfig } = require('../../../data/models');
const ai = require('../../../lib/ai');
const ui = require('../../../lib/ui');

module.exports = {
    async execute(ctx, args = []) {
        const executorId = isSlash(ctx) ? ctx.user.id : ctx.author?.id;
        const executor = ctx.guild.members.cache.get(executorId)
            || await ctx.guild.members.fetch(executorId).catch(() => null);

        if (!hasPermission(executor, PermissionsBitField.Flags.ManageGuild)) {
            return reply(ctx, ui.noPermission(
                'Necesitás el permiso **Gestionar servidor** para tocar la moderación asistida por IA.',
                { required: 'ManageGuild' },
            ));
        }

        const [config] = await AutomodConfig.findOrCreate({
            where: { guildId: ctx.guild.id },
            defaults: { guildId: ctx.guild.id },
        });

        // Sin argumento: muestra el estado y cómo funciona.
        if (args.length === 0) {
            const proveedores = ai.configuredProviders();
            const conKey = proveedores.filter(p => p.requiresKey).length;
            // La diferencia entre "la IA decide en 2 segundos" y "la IA tarda
            // 25 y no sirve para decidir" depende solo de esto.
            const rapido = conKey > 0;

            return reply(ctx, ui.payload({
                category: 'moderación',
                kicker: 'Moderación con IA',
                title: config.aiModeration ? 'Activada' : 'Desactivada',
                icon: config.aiModeration ? '🤖' : '🔒',
                description: [
                    'Cuando está activa, los mensajes que disparan **palabras prohibidas** o '
                    + '**mayúsculas excesivas** se consultan con la IA antes de borrarse. '
                    + 'Si la IA los marca como falso positivo (una cita, una broma, una '
                    + 'referencia), el mensaje sobrevive.',
                    '',
                    'Las reglas objetivas (invitaciones, enlaces, menciones masivas) **no** '
                    + 'se tocan: un regex acierta siempre y la IA solo gastaría cuota.',
                ].join('\n'),
                stats: [
                    { label: 'Estado', value: config.aiModeration ? '🟢 Activa' : '⚪ Inactiva', icon: '🤖' },
                    { label: 'Velocidad', value: rapido ? '🟢 Rápida' : '🟠 Lenta', icon: '⏱️' },
                    { label: 'Con key', value: `${conKey}/${proveedores.length}`, icon: '🔑' },
                ],
                lists: [
                    { title: 'Lo que sí revisa', items: ['Palabras prohibidas', 'Mayúsculas excesivas'] },
                    { title: 'Lo que nunca revisa', items: ['Invitaciones de Discord', 'Enlaces', 'Menciones masivas', 'Spam'] },
                ],
                callouts: [
                    {
                        tone: 'info',
                        text: 'No borra por su cuenta salvo con gravedad **8 o más**. En los demás casos avisa al canal de logs para que un humano decida.',
                    },
                    conKey === 0 ? {
                        tone: 'warning',
                        text: '**Sin API key la IA tarda 6 a 30 segundos y no sirve para decidir.** El filtro se aplicaría igual, pero el mensaje queda visible ese tiempo. Cargá `GEMINI_API_KEY` o `GROQ_API_KEY` en el `.env` para que esto funcione de verdad.',
                    } : {
                        tone: 'success',
                        text: `Con ${conKey} key cargada(s) la IA responde en 1-3 segundos: da tiempo a decidir antes de que el mensaje pase mucho tiempo visible.`,
                    },
                ].filter(Boolean),
                footerText: 'Para cambiar: `/automod aifilter true` o `/automod aifilter false`',
            }));
        }

        const arg = String(args[0]).toLowerCase();
        const activar = ['true', 'si', 'sí', 'on', '1', 'activar', 'enable'].includes(arg);

        if (!activar && !['false', 'no', 'off', '0', 'desactivar', 'disable'].includes(arg)) {
            return reply(ctx, ui.missingArgument(
                'Valor inválido',
                'Pasá `true` o `false`.',
                { usage: '/automod aifilter true' },
            ));
        }

        if (!activar && !ai.isConfigured()) {
            return reply(ctx, ui.error(
                'No hay ninguna IA configurada',
                'No se puede activar un filtro que no existe. Cargá `GEMINI_API_KEY` o `GROQ_API_KEY` en el `.env` y reiniciá el bot.',
            ));
        }

        // Activar sin key no es inútil pero conviene avisarlo: con Pollinations
        // solo, la IA tarda demasiado para servir como filtro.
        if (activar && !ai.configuredProviders().some(p => p.requiresKey)) {
            return reply(ctx, ui.payload({
                category: 'moderación',
                tone: 'warning',
                kicker: 'Sin API key',
                title: 'Va a funcionar, pero mal',
                icon: '⏱️',
                description: 'Sin `GEMINI_API_KEY` ni `GROQ_API_KEY`, la única IA disponible (Pollinations) tarda entre 6 y 30 segundos en responder. El filtro se aplicaría igual que sin IA, pero el mensaje queda visible ese tiempo.',
                callouts: [{
                    tone: 'info',
                    text: 'Cargá una key en <https://aistudio.google.com/apikey> o <https://console.groq.com/keys>, ponela en el `.env` como `GEMINI_API_KEY` y reiniciá. Con eso la IA responde en 1-3 segundos y la moderación empieza a servir.',
                }],
                footerText: '¿Querés activarlo igual? `/automod aifilter true`',
            }));
        }

        config.aiModeration = activar;
        await config.save();

        return reply(ctx, ui.payload({
            category: 'moderación',
            tone: activar ? 'success' : 'neutral',
            kicker: 'Moderación con IA',
            title: activar ? 'Filtro activado' : 'Filtro desactivado',
            icon: activar ? '🤖' : '🔒',
            description: activar
                ? 'A partir de ahora, los mensajes que disparen palabras prohibidas o mayúsculas se consultan con la IA antes de borrarse.'
                : 'Volvió la moderación clásica: los mensajes que disparen una regla se borran directamente, sin consultar a la IA.',
            callouts: [{
                tone: activar ? 'info' : 'muted',
                text: activar
                    ? 'Gasta cuota de IA, pero solo en los mensajes dudosos (típicamente el 1-5% del tráfico).'
                    : 'No se gasta más cuota en moderación.',
            }],
        }));
    },
};
