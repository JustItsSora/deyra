// src/hybrid/credits/credits.js
//
// Créditos y licencias.
//
// Este comando existe por una razón legal concreta: el módulo de música de
// Deyra está construido sobre Eleven Music (proyecto OpenUwU), y su licencia
// exige que la atribución se conserve. Que esté acá, y no en cada panel del bot,
// es una decisión: la atribución tiene que estar disponible y ser fácil de
// encontrar, pero no tiene que estar en cada mensaje que ve el usuario de un
// servidor.
//
// En /botinfo NO se menciona el proyecto original, y eso es intencional: la
// atribución legal está acá, en NOTICE.md y en el README del repositorio.

const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');
const config = require('../../config');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('credits')
        .setDescription('Muestra los créditos del bot y de las licencias de terceros'),

    name: 'credits',
    aliases: ['creditos', 'licencia', 'license'],
    category: 'utilidad',
    cooldownMs: 5000,

    async execute(ctx) {
        return reply(ctx, infoPanel('Créditos y licencias', null, {
            grid: [
                ['Bot', `${config.BOT_NAME} — código propio`],
                ['Autor', 'Ryu'],
                ['Licencia del bot', require('../../../package.json').license || 'MIT'],
            ],
            lists: [
                {
                    title: 'Módulo de música — proyecto de terceros',
                    items: [
                        'El diseño de filtros de audio, el panel de reproducción con controles, las playlists, los favoritos, el historial, el modo 24/7 y el fairplay están derivados de **Eleven Music**, del proyecto **OpenUwU** (`@priyanshu`, `@prayag`, `@bre4d777`, `@mooncarli`).',
                        '**github.com/openUwU/eleven** · licencia declarada por ese proyecto: `OUSL-1.0`.',
                        'Ese proyecto no incluye el texto de su licencia, así que Deyra se trata como derivado: publica su código fuente completo y no se ofrece como servicio pago.',
                        'El texto legal completo está en `NOTICE.md` dentro del repositorio.',
                    ],
                },
                {
                    title: 'Emojis',
                    items: [
                        'Los emojis del bot son de la propia aplicación de Discord, subidos desde `assets/emojis/`. No se usa ningún emoji de terceros.',
                    ],
                },
            ],
            footerText: 'Gracias a los que escribieron el código en el que esto se apoya.',
        }));
    },
};
