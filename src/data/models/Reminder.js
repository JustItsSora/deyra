const { Model, DataTypes } = require('sequelize');

class Reminder extends Model {
    static init(sequelize) {
        return super.init({
            userId: { type: DataTypes.STRING, allowNull: false },
            channelId: { type: DataTypes.STRING, allowNull: false },
            guildId: { type: DataTypes.STRING, allowNull: true },
            content: { type: DataTypes.STRING, allowNull: false },
            remindAt: { type: DataTypes.DATE, allowNull: false },
            sent: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        }, {
            sequelize,
            modelName: 'Reminder',
            tableName: 'reminders',
            indexes: [{ fields: ['sent', 'remindAt'] }],
        });
    }
}

module.exports = Reminder;
