// scripts/dbAddColumns.js
// Aplica la migración de columnas a mano. El boot del bot ya hace esto
// automáticamente (src/client.js → src/lib/autoMigrate.js); este script queda
// para uso explícito y diagnósticos.
//
// Uso:
//   node scripts/dbAddColumns.js            # muestra qué haría y lo aplica
//   node scripts/dbAddColumns.js --dry-run  # solo muestra
//
// Es idempotente: correrlo dos veces no hace nada la segunda vez.

require('dotenv').config();
process.env.BOT_TOKEN = process.env.BOT_TOKEN || 'placeholder';
process.env.CLIENT_ID = process.env.CLIENT_ID || '000000000000000000';

const { sequelize, dbReady } = require('../src/data/models');
const { runColumnMigrations } = require('../src/lib/autoMigrate');

const dryRun = process.argv.includes('--dry-run');

(async () => {
    try {
        await dbReady;
        const { added, pending } = await runColumnMigrations({ dryRun });
        if (dryRun && pending > 0) {
            console.log('\n[dry-run] No se aplicó nada. Corré sin --dry-run para aplicarlo.');
        } else if (added > 0) {
            console.log('\n[db] Listo. Ya podés arrancar el bot (o simplemente reiniciarlo: lo hace solo).');
        }
    } catch (err) {
        console.error('[db] Error:', err.message);
        process.exitCode = 1;
    } finally {
        await sequelize.close().catch(() => {});
    }
})();
