const { Model, DataTypes } = require('sequelize');

// Guarda cuántas veces `fromUserId` le hizo `action` a `toUserId` dentro de un guild.
// La clave es direccional (A besó a B se cuenta aparte de B besó a A) porque así
// se puede mostrar "le has dado 5 besos a X" de forma intuitiva para cada usuario.
class InteractionCount extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            fromUserId: { type: DataTypes.STRING, allowNull: false },
            toUserId: { type: DataTypes.STRING, allowNull: false },
            action: { type: DataTypes.STRING, allowNull: false }, // 'hug', 'kiss', 'pat', etc.
            count: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        }, {
            sequelize,
            modelName: 'InteractionCount',
            tableName: 'interaction_counts',
            indexes: [{ unique: true, fields: ['guildId', 'fromUserId', 'toUserId', 'action'] }],
        });
    }
}

module.exports = InteractionCount;
