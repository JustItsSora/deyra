const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { infoPanel } = require('../../lib/panel');

const PUNS = [
    '¿Cómo se dice pared en árabe? Muro-hammad.',
    'Un panda entra a un bar, come, dispara y se va. Así de "blanco y negro" es el humor.',
    '¿Qué le dijo un techo a otro techo? Techo de menos.',
    '¿Cómo llamas a un boomerang que no regresa? Un palo.',
    '¿Qué hace una abeja en el gimnasio? Zum-ba.',
    'Fui a la ferretería a comprar un clavo... pero no me convenció.',
];

module.exports = {
    data: new SlashCommandBuilder()
        .setName('pun')
        .setDescription('Comparte un juego de palabras aleatorio'),

    name: 'pun',
    aliases: ['juegodepalabras'],
    category: 'diversión',
    cooldownMs: 2000,

    async execute(ctx) {
        const pun = PUNS[Math.floor(Math.random() * PUNS.length)];
        return reply(ctx, infoPanel('🎭 Juego de palabras', pun));
    },
};
