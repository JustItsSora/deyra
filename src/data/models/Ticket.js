const { Model, DataTypes } = require('sequelize');

class Ticket extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            channelId: { type: DataTypes.STRING, allowNull: false, unique: true },
            userId: { type: DataTypes.STRING, allowNull: false },
            ticketNumber: { type: DataTypes.INTEGER, allowNull: false },
            status: { type: DataTypes.ENUM('open', 'claimed', 'closed'), allowNull: false, defaultValue: 'open' },
            claimedBy: { type: DataTypes.STRING, allowNull: true },
            closedBy: { type: DataTypes.STRING, allowNull: true },
            closedAt: { type: DataTypes.DATE, allowNull: true },
            reason: { type: DataTypes.STRING, allowNull: true },
        }, {
            sequelize,
            modelName: 'Ticket',
            tableName: 'tickets',
            indexes: [{ unique: true, fields: ['channelId'] }, { fields: ['guildId', 'status'] }],
        });
    }
}

module.exports = Ticket;
