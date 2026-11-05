const { Model, DataTypes } = require('sequelize');

class Economy extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            userId: { type: DataTypes.STRING, allowNull: false },
            wallet: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
            bank: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 0 },
            bankCapacity: { type: DataTypes.BIGINT, allowNull: false, defaultValue: 5000 },
            lastDaily: { type: DataTypes.DATE, allowNull: true },
            lastWork: { type: DataTypes.DATE, allowNull: true },
            lastCrime: { type: DataTypes.DATE, allowNull: true },
            lastRob: { type: DataTypes.DATE, allowNull: true },
            lastWeekly: { type: DataTypes.DATE, allowNull: true },
            lastBeg: { type: DataTypes.DATE, allowNull: true },
            dailyStreak: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            inventory: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' }, // JSON string array de itemIds
        }, {
            sequelize,
            modelName: 'Economy',
            tableName: 'economy',
            indexes: [{ unique: true, fields: ['guildId', 'userId'] }],
        });
    }
}

module.exports = Economy;
