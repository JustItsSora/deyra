// src/lib/commandSuggest.js
//
// "¿Quisiste decir...?" para comandos que no existen.
//
// El problema que resuelve: `!djjoin` no existe, y el bot se quedaba mudo.
// Eso es peor que un error, porque el usuario no sabe si se equivocó de nombre,
// si el bot está roto, o si se olvidó del prefijo. Lo mismo pasaba en el otro
// extremo: un comando que existe pero tiraba excepción mostraba "Ocurrió un
// error ejecutando este comando", que no dice nada.
//
// Acá vive solo el cálculo de similitud. Los paneles los arma el caller, porque
// slash y prefijo los responden por canales distintos.

/**
 * Distancia de Levenshtein con dos filas. O(n·m) en memoria, que para nombres
 * de comando (cortos) es irrelevante y evita la matriz completa.
 */
function levenshtein(a, b) {
    if (a === b) return 0;
    if (!a.length) return b.length;
    if (!b.length) return a.length;

    let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
    const curr = new Array(b.length + 1);

    for (let i = 1; i <= a.length; i++) {
        curr[0] = i;
        for (let j = 1; j <= b.length; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            curr[j] = Math.min(
                prev[j] + 1,      // borrar
                curr[j - 1] + 1,   // insertar
                prev[j - 1] + cost // reemplazar
            );
        }
        prev = curr.slice();
    }
    return prev[b.length];
}

/**
 * Qué tan parecidas son dos palabras, de 0 (nada que ver) a 1 (idénticas).
 *
 * Combina distancia de edición con un chequeo de prefijo, porque los typos
 * reales en Discord casi siempre son de prefijo: `!clear` → `!claer`,
 * `!djoin` → `!djoin`. La distancia sola penaliza esos casos más de lo que
 * debería: "claer" vs "clear" son 2 ediciones sobre 5 letras, pero el usuario
 * claramente quiso decir "clear".
 */
function similarity(a, b) {
    if (!a || !b) return 0;
    if (a === b) return 1;

    const dist = levenshtein(a, b);
    const maxLen = Math.max(a.length, b.length);
    let score = 1 - dist / maxLen;

    // Prefijo común: sube el score, con techo para no pasar de 1.
    let common = 0;
    while (common < Math.min(a.length, b.length) && a[common] === b[common]) common++;
    if (common >= 2) score = Math.max(score, 0.7 + 0.3 * (common / maxLen));

    return Math.min(1, score);
}

/**
 * Sugerencias para un comando que no existe.
 *
 * @param {string} entered  lo que el usuario escribió, ya en minúsculas
 * @param {Iterable<string>} candidates  nombres válidos
 * @param {number} [limit=3]
 * @returns {string[]} nombres reales, del más parecido al menos
 */
function suggest(entered, candidates, limit = 3) {
    if (!entered || !candidates) return [];

    const target = entered.toLowerCase();
    const scored = [];

    for (const name of candidates) {
        if (!name || name === target) continue;
        const s = similarity(target, name.toLowerCase());
        // 0.45 descarta lo que no se parece en nada. Con 900 comandos en el
        // bot, un umbral bajo llena el panel de basura.
        if (s >= 0.45) scored.push({ name, score: s });
    }

    scored.sort((a, b) => b.score - a.score || a.name.length - b.name.length);

    // Solo devolvemos sugerencias si la mejor es convincente. Un 0.5 exacto
    // es una señal de que el usuario inventó un nombre, no de que se
    // equivocó de letra.
    if (!scored.length || scored[0].score < 0.5) return [];

    return scored.slice(0, limit).map(s => s.name);
}

module.exports = { levenshtein, similarity, suggest };
