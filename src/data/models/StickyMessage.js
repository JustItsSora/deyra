const { Model, DataTypes } = require('sequelize');

class StickyMessage extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            channelId: { type: DataTypes.STRING, allowNull: false, unique: true },
            content: { type: DataTypes.TEXT, allowNull: false },
            lastMessageId: { type: DataTypes.STRING, allowNull: true },
        }, {
            sequelize,
            modelName: 'StickyMessage',
            tableName: 'sticky_messages',
            indexes: [{ unique: true, fields: ['channelId'] }],
        });
    }
}

module.exports = StickyMessage;
