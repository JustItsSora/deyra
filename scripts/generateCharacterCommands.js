// scripts/generateCharacterCommands.js
// Genera los comandos de imagen de personaje (/waifu, /neko, /kitsune, ...)
// a partir de CHARACTER_CATEGORIES en src/lib/gifApi.js.
//
// Son 8 comandos idénticos salvo el nombre, el emoji y la fuente, así que
// tiene más sentido generarlos que mantener 8 archivos casi iguales.
//
// Uso: node scripts/generateCharacterCommands.js [--force] [--dry-run]

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const fs = require('fs');
const path = require('path');
const { SlashCommandBuilder } = require('discord.js');
const { CHARACTER_CATEGORIES } = require('../src/lib/gifApi');

const HYBRID_DIR = path.join(__dirname, '..', 'src', 'hybrid');
const force = process.argv.includes('--force');
const dryRun = process.argv.includes('--dry-run');

/** Nombre visible, emoji y alias de cada categoría. */
const PROFILE = {
    waifu: { display: 'Waifu', emoji: '🌸', aliases: ['waifus'] },
    neko: { display: 'Neko', emoji: '🐱', aliases: ['nekos'] },
    kitsune: { display: 'Kitsune', emoji: '🦊', aliases: ['foxgirl'] },
    husbando: { display: 'Husbando', emoji: '🧑', aliases: ['husbandos'] },
    shiro: { display: 'Shiro', emoji: '⚪', aliases: [] },
    senko: { display: 'Senko', emoji: '🦊', aliases: [] },
    okami: { display: 'Okami', emoji: '🐺', aliases: [] },
    holo: { display: 'Holo', emoji: '🐉', aliases: [] },
};

function template(key, profile) {
    return `// Generado por scripts/generateCharacterCommands.js — no editar a mano.
// La fuente real está en src/lib/gifApi.js (CHARACTER_CATEGORIES.${key}).
const { SlashCommandBuilder } = require('discord.js');
const { reply } = require('../../lib/reply');
const { getCharacterImage } = require('../../lib/gifApi');
const ui = require('../../lib/ui');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('${key}')
        .setDescription('Muestra una imagen de ${profile.display.toLowerCase()} de anime'),

    name: '${key}',
    aliases: ${JSON.stringify(profile.aliases)},
    category: 'diversión',
    cooldownMs: 3000,

    async execute(ctx) {
        let image;
        try {
            image = await getCharacterImage('${key}');
        } catch (err) {
            console.error('[${key}] Error:', err.message);
            return reply(ctx, ui.error(
                'No pude obtener la imagen',
                'Ninguna fuente de imágenes respondió ahora mismo.',
                { hint: 'Probá de nuevo en unos segundos.', ephemeral: true },
            ));
        }

        // nekos.best devuelve el AUTOR y el link de pixiv para las imágenes de
        // personaje (waifu/neko/kitsune/husbando); los GIFs de rol no tienen
        // ese dato. Por eso el crédito es condicional.
        const credit = image.author
            ? \`De la obra de **\${image.author}**.\`
            : 'Un personaje para tu colección.';

        return reply(ctx, ui.imagePayload({
            category: 'diversión',
            icon: '${profile.emoji}',
            kicker: 'Galería de personajes',
            title: '${profile.display}',
            caption: credit,
            media: { url: image.url, description: image.author || null },
            source: image.source,
            author: image.author || undefined,
            sourceUrl: image.sourceUrl || undefined,
        }));
    },
};
`;
}

let created = 0;
let skipped = 0;

for (const key of Object.keys(CHARACTER_CATEGORIES)) {
    const profile = PROFILE[key];
    if (!profile) {
        console.warn(`  ⚠ Sin perfil visual para "${key}": falta en PROFILE de este script.`);
        continue;
    }

    const dir = path.join(HYBRID_DIR, key);
    const file = path.join(dir, `${key}.js`);

    if (fs.existsSync(file) && !force) {
        skipped++;
        continue;
    }
    if (dryRun) {
        console.log(`[dry-run] crearía ${key}`);
        created++;
        continue;
    }

    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, template(key, profile));
    created++;
}

console.log(`[character-commands] ${created} creados, ${skipped} ya existían.`);
