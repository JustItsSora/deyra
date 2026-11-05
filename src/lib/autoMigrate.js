// src/lib/autoMigrate.js
// Migración de columnas compartida entre el boot del bot y scripts/dbAddColumns.js.
//
// Sequelize#sync() crea las tablas que faltan pero NO altera las existentes,
// por diseño. Esta utilidad compara los modelos con el esquema real y agrega
// SOLO columnas faltantes (aditivo, idempotente). Nunca borra ni modifica
// datos: lo peor que puede pasar es un ALTER vacío rechazado por la DB, que
// se captura y se loguea.

const { DataTypes } = require('sequelize');
const { sequelize } = require('../data/models');

// Columnas que se agregan fuera de la definición de los modelos (histórico).
const EXTRA_COLUMNS = {
    guild_configs: {
        language: { type: DataTypes.STRING, allowNull: false, defaultValue: 'es' },
    },
};

function describeType(type) {
    if (!type) return 'unknown';
    const key = type.key || type.constructor?.key || '';
    return String(key).toLowerCase() || 'unknown';
}

async function tableExists(queryInterface, table) {
    const tables = await queryInterface.showAllTables();
    const normalized = tables.map(t => (typeof t === 'string' ? t : t.tableName));
    return normalized.includes(table);
}

/**
 * @param {object} opts
 * @param {boolean} [opts.dryRun] Solo reportar, no aplicar.
 * @param {(msg: string) => void} [opts.log] Logger (default console.log).
 * @returns {Promise<{added: number, pending: number}>}
 */
async function runColumnMigrations({ dryRun = false, log = console.log } = {}) {
    const queryInterface = sequelize.getQueryInterface();
    const dialect = sequelize.getDialect();

    const additions = [];
    for (const [modelName, model] of Object.entries(sequelize.models)) {
        const table = model.getTableName();
        if (!(await tableExists(queryInterface, table))) continue;

        const described = await queryInterface.describeTable(table);
        const existing = new Set(Object.keys(described));

        for (const [attrName, definition] of Object.entries(model.rawAttributes)) {
            const column = attrName.field || attrName.columnName || attrName;
            if (!column || existing.has(column)) continue;
            if (definition.primaryKey) continue;
            additions.push({ table, column, definition: definition.type, modelName });
        }
    }

    for (const [table, columns] of Object.entries(EXTRA_COLUMNS)) {
        if (!(await tableExists(queryInterface, table))) continue;
        const described = await queryInterface.describeTable(table);
        for (const [column, definition] of Object.entries(columns)) {
            if (described[column]) continue;
            additions.push({ table, column, definition: definition.type, modelName: 'EXTRA_COLUMNS' });
        }
    }

    // Dedup por tabla.columna: una misma columna puede venir del modelo y de
    // EXTRA_COLUMNS (o de dos modelos con la misma tabla); sin esto, el
    // segundo ALTER explota con "duplicate column".
    const seen = new Set();
    const uniqueAdditions = additions.filter(a => {
        const key = `${a.table}.${a.column}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });

    if (!uniqueAdditions.length) {
        log(`[db] Esquema al día (${dialect}). No hay columnas que agregar.`);
        return { added: 0, pending: 0 };
    }

    log(`[db] Base: ${dialect} · ${uniqueAdditions.length} columna(s) nueva(s):`);
    for (const a of uniqueAdditions) {
        log(`  · ${a.table}.${a.column} (${describeType(a.definition)}) ← ${a.modelName}`);
    }

    if (dryRun) {
        return { added: 0, pending: uniqueAdditions.length };
    }

    let added = 0;
    let failed = 0;
    for (const { table, column, definition } of uniqueAdditions) {
        try {
            const described = await queryInterface.describeTable(table);
            const options = { type: definition };
            if (definition === DataTypes.BOOLEAN || definition === DataTypes.INTEGER) {
                options.allowNull = false;
                options.defaultValue = definition === DataTypes.BOOLEAN ? false : 0;
            } else {
                options.allowNull = true;
            }
            if (Object.keys(described).length > 0) options.allowNull = true;

            await queryInterface.addColumn(table, column, options);
            log(`  ✔ agregada ${table}.${column}`);
            added += 1;
        } catch (err) {
            failed += 1;
            log(`  ✖ ${table}.${column}: ${err.message}`);
        }
    }

    if (failed > 0) {
        log(`[db] Migración terminada con ${failed} columna(s) sin aplicar (detalle arriba).`);
    } else {
        log('[db] Esquema actualizado.');
    }
    return { added, pending: failed };
}

module.exports = { runColumnMigrations };
