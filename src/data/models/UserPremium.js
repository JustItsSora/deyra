// src/data/models/UserPremium.js
//
// Premium por USUARIO. Puerto de la tabla `user_premium` del bot de música
// viejo, con la diferencia importante de que acá los premium tienen
// VENCIMIENTO real (expiresAt), porque en el bot viejo la columna se había
// borrado en una migración y el premium era eterno.
//
// Tiers (src/lib/premium.js): 'lite' | 'basic' | 'premium' | 'owner'.
// 'owner' no caduca y es el del dueño del bot (Ryu), lo usa /premium para
// que el owner tenga todos los límites abiertos sin tocar código.

const { Model, DataTypes } = require('sequelize');

class UserPremium extends Model {
    static init(sequelize) {
        return super.init({
            userId: { type: DataTypes.STRING, allowNull: false, unique: true },
            tier: { type: DataTypes.STRING, allowNull: false, defaultValue: 'lite' },

            // Cuántos servidores premium puede activar este usuario. El valor
            // sale del tier (premiumTiers) pero se guarda en la fila para que
            // cambiar un tier en el código no reescriba la historia de los
            // usuarios que ya lo compraron.
            serverActivations: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

            activatedAt: { type: DataTypes.DATE, allowNull: true },
            expiresAt: { type: DataTypes.DATE, allowNull: true },
            grantedBy: { type: DataTypes.STRING, allowNull: true },
        }, {
            sequelize,
            modelName: 'UserPremium',
            tableName: 'user_premiums',
            indexes: [{ unique: true, fields: ['userId'] }],
        });
    }
}

module.exports = UserPremium;
