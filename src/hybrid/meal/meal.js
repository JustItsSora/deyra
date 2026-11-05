// /meal — receta completa con imagen e ingredientes (TheMealDB).
// Complementa a /recipeidea (que solo da una idea): este trae la receta entera.

const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { randomMeal } = require('../../lib/api/lookupApi');
const ui = require('../../lib/ui');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('meal')
        .setDescription('Muestra una receta completa con imagen e ingredientes')
        .addIntegerOption(o => o
            .setName('ingredientes')
            .setDescription('Cuántos ingredientes mostrar (3 a 12, por defecto 8)')
            .setMinValue(3)
            .setMaxValue(12)
            .setRequired(false)),

    name: 'meal',
    aliases: ['receta', 'recipe'],
    category: 'diversión',
    cooldownMs: 6000,

    async execute(ctx, args = []) {
        const max = 12;

        let meal;
        try {
            meal = await randomMeal();
        } catch (err) {
            console.error('[meal] Error:', err.message);
            return reply(ctx, ui.error('No pude obtener la receta', 'TheMealDB no respondió ahora mismo.', { ephemeral: true }));
        }

        const limit = 10;
        const shown = meal.ingredients.slice(0, limit);

        // La instrucción es larga; se corta en pasos numerados para que se lea
        // de a un bloque y no como un muro de texto.
        const steps = meal.instructions
            .split(/\r?\n+|(?:\s+\d+[.)]\s+)/)
            .map(s => s.replace(/^\s*\d+[.)]\s*/, '').trim())
            .filter(s => s.length > 12)
            .slice(0, 5);

        return reply(ctx, ui.imagePayload({
            category: 'diversión',
            icon: '🍽️',
            kicker: 'TheMealDB',
            title: meal.name,
            caption: [meal.category, meal.area].filter(Boolean).map(v => `\`${v}\``).join(' · ') || null,
            media: { url: meal.image, description: meal.name },
            source: 'TheMealDB',
            sourceUrl: meal.source || 'https://www.themealdb.com',
            grid: [
                ['Categoría', meal.category || '—'],
                ['Origen', meal.area || '—'],
                ['Ingredientes', `${meal.ingredients.length}`],
                ...(meal.tags.length ? [['Etiquetas', meal.tags.join(', ')]] : []),
            ],
            lists: [{
                title: `Ingredientes${meal.ingredients.length > limit ? ` (${limit} de ${meal.ingredients.length})` : ''}`,
                items: shown.map(i => `• ${i}`),
            }],
            quote: steps.length ? {
                text: steps.join('\n\n'),
                footer: steps.length > 5 ? 'Preparación (recortada)' : 'Preparación',
            } : undefined,
        }));
    },
};
