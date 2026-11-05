const { Model, DataTypes } = require('sequelize');

class Birthday extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            userId: { type: DataTypes.STRING, allowNull: false },
            day: { type: DataTypes.INTEGER, allowNull: false },   // 1-31
            month: { type: DataTypes.INTEGER, allowNull: false }, // 1-12
            lastCelebratedYear: { type: DataTypes.INTEGER, allowNull: true },
        }, {
            sequelize,
            modelName: 'Birthday',
            tableName: 'birthdays',
            indexes: [{ unique: true, fields: ['guildId', 'userId'] }, { fields: ['month', 'day'] }],
        });
    }
}

module.exports = Birthday;
