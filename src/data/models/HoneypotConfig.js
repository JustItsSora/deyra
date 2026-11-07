// src/data/models/HoneypotConfig.js
// Canal señuelo: invisible para miembros legítimos, irresistible para bots de
// spam y raiders. Quien escriba ahí demuestra que no es un humano normal del
// servidor, y Deyra ejecuta el castigo configurado.

const { Model, DataTypes } = require('sequelize');

class HoneypotConfig extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false, unique: true },
            enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            channelId: { type: DataTypes.STRING, allowNull: true },
            // Qué le pasa a quien caiga en la trampa.
            action: { type: DataTypes.ENUM('timeout', 'kick', 'ban'), allowNull: false, defaultValue: 'kick' },
            // Minutos de timeout cuando action = 'timeout'. Default: 1 día.
            timeoutMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1440 },
            // Auto-crear el canal señuelo al activar si no hay uno asignado.
            // (La creación real la hace quien llama a ensureHoneypotChannel:
            //  el comando /honeypot setup, la API o el toggle.)
            // Frecuencia de rotación en MINUTOS. 0 = el nombre NO rota.
            // Migrado de rotationHours (horas) por autoMigrate (backfill x60).
            rotationMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            // Borra los mensajes recientes del usuario en el canal señuelo al caer.
            autoPurge: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            // Cuántas detecciones acumula (visible en /honeypot stats).
            caughtCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            lastRotationAt: { type: DataTypes.DATE, allowNull: true },
        }, {
            sequelize,
            modelName: 'HoneypotConfig',
            tableName: 'honeypot_configs',
            indexes: [{ unique: true, fields: ['guildId'] }],
        });
    }
}

module.exports = HoneypotConfig;
