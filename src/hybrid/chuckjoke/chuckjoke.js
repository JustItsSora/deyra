// /chuckjoke — chiste de Chuck Norris (api.chucknorris.io, sin key).

const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { chuckJoke } = require('../../lib/api/lookupApi');
const ui = require('../../lib/ui');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('chuckjoke')
        .setDescription('Cuenta un chiste de Chuck Norris'),

    name: 'chuckjoke',
    aliases: ['chuck', 'chucknorris'],
    category: 'diversión',
    cooldownMs: 4000,

    async execute(ctx) {
        let joke;
        try {
            joke = await chuckJoke();
        } catch (err) {
            console.error('[chuckjoke] Error:', err.message);
            return reply(ctx, ui.error('No pude obtener un chiste', 'La API de Chuck Norris no respondió.', { ephemeral: true }));
        }

        return reply(ctx, ui.payload({
            category: 'diversión',
            icon: '🥋',
            kicker: 'Chuck Norris Facts',
            title: 'Dato de Chuck',
            quote: { text: joke.text, author: 'Chuck Norris' },
            callouts: joke.url ? [{ tone: 'muted', text: `[Fuente original](${joke.url})` }] : undefined,
        }));
    },
};
