const { Model, DataTypes } = require('sequelize');

class Giveaway extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            channelId: { type: DataTypes.STRING, allowNull: false },
            messageId: { type: DataTypes.STRING, allowNull: false, unique: true },
            hostId: { type: DataTypes.STRING, allowNull: false },
            prize: { type: DataTypes.STRING, allowNull: false },
            winnerCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
            endsAt: { type: DataTypes.DATE, allowNull: false },
            ended: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            entrants: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' }, // JSON array de userIds
            winners: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
            requiredRoleId: { type: DataTypes.STRING, allowNull: true },
        }, {
            sequelize,
            modelName: 'Giveaway',
            tableName: 'giveaways',
            indexes: [{ unique: true, fields: ['messageId'] }, { fields: ['ended', 'endsAt'] }],
        });
    }
}

module.exports = Giveaway;
