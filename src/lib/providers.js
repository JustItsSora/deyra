// src/lib/providers.js
// Registro de proveedores externos con estado de salud.
//
// El problema que resuelve: un bot que depende de 20 APIs gratuitas se rompe
// cada semana. Una de ellas se cae, cambia su respuesta, o Cloudflare le
// levanta un muro, y de golpe medio bot "no funciona" sin que se entienda por
// qué.
//
// La estrategia es la misma que usan los bots que se toman en serio el uptime:
//
//   · Cada comando declara una LISTA de proveedores, en orden de preferencia.
//   · Se prueban en cadena hasta que uno responde bien.
//   · El que falla queda "en cuarentena" unos minutos (circuit breaker): no se
//     vuelve a intentar hasta que pase el cooldown, así un proveedor caído no
//     agrega 12 segundos de espera a cada comando.
//   · `/botinfo` y `/bothealth` pueden mostrar el estado de cada uno.

const FAILURE_THRESHOLD = 3;   // fallos seguidos para abrir el circuito
const OPEN_MS = 5 * 60 * 1000;  // 5 min en cuarentena

/** @type {Map<string, {name: string, failures: number, openUntil: number, lastError: string|null, lastOk: number|null, total: number, failed: number}>} */
const state = new Map();

function entry(name) {
    if (!state.has(name)) {
        state.set(name, { name, failures: 0, openUntil: 0, lastError: null, lastOk: null, total: 0, failed: 0 });
    }
    return state.get(name);
}

/** true si el proveedor está en cuarentena y no conviene intentarlo. */
function isOpen(name) {
    return entry(name).openUntil > Date.now();
}

/** Registra un éxito: resetea el contador y cierra el circuito. */
function markOk(name) {
    const e = entry(name);
    e.failures = 0;
    e.openUntil = 0;
    e.lastError = null;
    e.lastOk = Date.now();
    e.total++;
}

/** Registra un fallo: abre el circuito si se acumulan los suficientes. */
function markFail(name, err) {
    const e = entry(name);
    e.failures++;
    e.total++;
    e.failed++;
    e.lastError = err?.message ? String(err.message).slice(0, 200) : String(err);
    if (e.failures >= FAILURE_THRESHOLD) {
        e.openUntil = Date.now() + OPEN_MS;
    }
}

/** Snapshot del estado de todos los proveedores conocidos. */
function health() {
    return [...state.values()].map((e) => ({
        name: e.name,
        status: e.openUntil > Date.now() ? 'offline' : (e.lastOk ? 'online' : 'unknown'),
        failures: e.failures,
        lastError: e.lastError,
        lastOk: e.lastOk,
        successRate: e.total ? Math.round(((e.total - e.failed) / e.total) * 100) : null,
        openFor: e.openUntil > Date.now() ? e.openUntil - Date.now() : 0,
    }));
}

/**
 * Prueba una lista de proveedores en orden hasta que uno funcione.
 *
 * @param {Array<{name: string, run: (ctx: object) => Promise<any>}>} providers
 * @param {{label?: string, context?: object}} [opts]
 *   `label` agrupa los proveedores de una misma operación (ej: 'gif:hug') para
 *   que las estadísticas tengan sentido.
 * @returns {Promise<{value: any, provider: string, attempts: string[]}>}
 * @throws si ninguno funciona
 */
async function withFallback(providers, { label = 'desconocido', context = {} } = {}) {
    if (!providers?.length) throw new Error(`withFallback sin proveedores (${label})`);

    const attempts = [];
    const errors = [];

    for (const provider of providers) {
        const name = `${label}:${provider.name}`;

        if (isOpen(name)) {
            attempts.push(`${provider.name}(en cuarentena)`);
            continue;
        }

        try {
            const value = await provider.run(context);
            markOk(name);
            return { value, provider: provider.name, attempts };
        } catch (err) {
            markFail(name, err);
            attempts.push(`${provider.name}(falló)`);
            errors.push(`${provider.name}: ${err.message}`);
        }
    }

    const err = new Error(`Ningún proveedor funcionó para "${label}". Probados: ${attempts.join(', ')}. Últimos errores → ${errors.slice(-2).join(' | ')}`);
    err.providers = attempts;
    err.detail = errors;
    throw err;
}

/** Reinicia el estado de un proveedor (o de todos). Comando /reload. */
function reset(name) {
    if (!name) { state.clear(); return; }
    state.delete(name);
}

module.exports = { withFallback, isOpen, markOk, markFail, health, reset, OPEN_MS };
