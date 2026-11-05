const { Model, DataTypes } = require('sequelize');

class ReactionRole extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            messageId: { type: DataTypes.STRING, allowNull: false },
            channelId: { type: DataTypes.STRING, allowNull: false },
            // Mapa emoji -> roleId, como JSON string: { "😀": "123456789" }
            mapping: { type: DataTypes.TEXT, allowNull: false, defaultValue: '{}' },
            mode: { type: DataTypes.ENUM('toggle', 'unique'), allowNull: false, defaultValue: 'toggle' }, // unique = solo un rol de este grupo a la vez
        }, {
            sequelize,
            modelName: 'ReactionRole',
            tableName: 'reaction_roles',
            indexes: [{ fields: ['guildId', 'messageId'] }],
        });
    }
}

module.exports = ReactionRole;
