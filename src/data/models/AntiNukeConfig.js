// src/data/models/AntiNukeConfig.js
// Anti-nuke: detecta ráfagas de acciones destructivas (borrar canales/roles,
// banear masivamente, crear webhooks) hechas por una misma cuenta y la
// neutraliza antes de que "destroce" el servidor.
//
// El patrón clásico de un nuke: cuenta comprometida o admin malicioso que en
// pocos segundos borra canales, roles grandes o banea gente al azar. El audit
// log de Discord dice QUIÉN lo hizo, así que el bot corta por lo sano.

const { Model, DataTypes } = require('sequelize');

class AntiNukeConfig extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false, unique: true },
            enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            // ban: banea al autor · derank: le quita todos los roles · log: solo registra.
            action: { type: DataTypes.ENUM('ban', 'derank', 'log'), allowNull: false, defaultValue: 'ban' },
            // Acciones sospechosas dentro de la ventana que disparan la protección.
            threshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 3 },
            windowMinutes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 10 },
            whitelistedUsers: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
            whitelistedRoles: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
        }, {
            sequelize,
            modelName: 'AntiNukeConfig',
            tableName: 'antinuke_configs',
            indexes: [{ unique: true, fields: ['guildId'] }],
        });
    }
}

module.exports = AntiNukeConfig;
