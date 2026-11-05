const { Model, DataTypes } = require('sequelize');

class Leveling extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            userId: { type: DataTypes.STRING, allowNull: false },
            xp: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
            level: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            totalMessages: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
            lastMessageAt: { type: DataTypes.DATE, allowNull: true }, // para cooldown de XP por mensaje
        }, {
            sequelize,
            modelName: 'Leveling',
            tableName: 'leveling',
            indexes: [{ unique: true, fields: ['guildId', 'userId'] }],
        });
    }
}

module.exports = Leveling;
