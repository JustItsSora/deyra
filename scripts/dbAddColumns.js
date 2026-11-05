// scripts/dbAddColumns.js
// Agrega columnas nuevas a tablas que YA existen.
//
// Sequelize#sync() crea las tablas que faltan pero, por diseño, NO altera las
// que ya están: protects los datos reales a costa de que cada columna nueva
// haya que sumarla a mano en las instalaciones viejas.
//
// Este script recorre los modelos, compara las columnas declaradas con las que
// existen de verdad en la base, y agrega solo las que faltan. Es idempotente:
// correrlo dos veces no hace nada la segunda vez.
//
// Uso:
//   node scripts/dbAddColumns.js            # muestra qué haría y lo aplica
//   node scripts/dbAddColumns.js --dry-run  # solo muestra
//
// Conviene correrlo una vez después de cada versión que agregue columnas,
// ANTES de arrancar el bot.

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const { DataTypes } = require('sequelize');
const { sequelize, dbReady } = require('../src/data/models');

const dryRun = process.argv.includes('--dry-run');

// Columnas que se agregan fuera de la definición de los modelos (histórico).
const EXTRA_COLUMNS = {
    guild_configs: {
        language: { type: DataTypes.STRING, allowNull: false, defaultValue: 'es' },
    },
};

async function tableExists(queryInterface, table) {
    const tables = await queryInterface.showAllTables();
    const normalized = tables.map(t => (typeof t === 'string' ? t : t.tableName));
    return normalized.includes(table);
}

(async () => {
    try {
        await dbReady;
        // El query interface cuelga de la instancia, no del módulo.
        const queryInterface = sequelize.getQueryInterface();
        const dialect = sequelize.getDialect();

        const additions = [];
        for (const [modelName, model] of Object.entries(sequelize.models)) {
            const table = model.getTableName();
            if (!(await tableExists(queryInterface, table))) continue;

            const described = await queryInterface.describeTable(table);
            const existing = new Set(Object.keys(described));

            for (const [attrName, definition] of Object.entries(model.rawAttributes)) {
                // `field`/`columnName` es el nombre explícito si el modelo lo
                // define; si no, la columna se llama como la clave del atributo.
                const column = attrName.field || attrName.columnName || attrName;
                if (!column || existing.has(column)) continue;
                if (definition.primaryKey) continue;
                additions.push({ table, column, definition: definition.type, modelName });
            }
        }

        // Extras declarados arriba (por si el modelo no se actualizó).
        for (const [table, columns] of Object.entries(EXTRA_COLUMNS)) {
            if (!(await tableExists(queryInterface, table))) continue;
            const described = await queryInterface.describeTable(table);
            for (const [column, definition] of Object.entries(columns)) {
                if (described[column]) continue;
                additions.push({ table, column, definition: definition.type, modelName: 'EXTRA_COLUMNS' });
            }
        }

        if (!additions.length) {
            console.log(`[db] La base ya está al día (${dialect}). No hay columnas que agregar.`);
            return;
        }

        console.log(`[db] Base: ${dialect} · ${additions.length} columna(s) nueva(s):`);
        for (const a of additions) {
            console.log(`  · ${a.table}.${a.column} (${describeType(a.definition)}) ← ${a.modelName}`);
        }

        if (dryRun) {
            console.log('\n[dry-run] No se aplicó nada. Corré sin --dry-run para aplicarlo.');
            return;
        }

        for (const { table, column, definition } of additions) {
            const described = await queryInterface.describeTable(table);
            // allowNull false necesita default, o el ALTER falla en tablas con datos.
            const options = { type: definition };
            if (definition === DataTypes.BOOLEAN || definition === DataTypes.INTEGER) {
                options.allowNull = false;
                options.defaultValue = definition === DataTypes.BOOLEAN ? false : 0;
            } else {
                options.allowNull = true;
            }
            // Preservamos nulls existentes si la tabla ya tiene filas.
            if (Object.keys(described).length > 0) options.allowNull = true;

            await queryInterface.addColumn(table, column, options);
            console.log(`  ✔ agregada ${table}.${column}`);
        }

        console.log('\n[db] Listo. Ya podés arrancar el bot.');
    } catch (err) {
        console.error('[db] Error:', err.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close().catch(() => {});
    }
})();

function describeType(type) {
    if (!type) return 'unknown';
    const key = type.key || type.constructor?.key || '';
    return String(key).toLowerCase() || 'unknown';
}
