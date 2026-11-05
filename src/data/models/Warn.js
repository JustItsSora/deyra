const { Model, DataTypes } = require('sequelize');

class Warn extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            userId: { type: DataTypes.STRING, allowNull: false },
            moderatorId: { type: DataTypes.STRING, allowNull: false },
            reason: { type: DataTypes.STRING, allowNull: false, defaultValue: 'Sin razón especificada' },
        }, {
            sequelize,
            modelName: 'Warn',
            tableName: 'warns',
            indexes: [{ fields: ['guildId', 'userId'] }],
        });
    }
}

module.exports = Warn;
