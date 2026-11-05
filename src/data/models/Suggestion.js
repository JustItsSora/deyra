const { Model, DataTypes } = require('sequelize');

class Suggestion extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            messageId: { type: DataTypes.STRING, allowNull: false, unique: true },
            authorId: { type: DataTypes.STRING, allowNull: false },
            content: { type: DataTypes.STRING, allowNull: false },
            status: { type: DataTypes.ENUM('pending', 'approved', 'denied'), allowNull: false, defaultValue: 'pending' },
            upvotes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            downvotes: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        }, {
            sequelize,
            modelName: 'Suggestion',
            tableName: 'suggestions',
            indexes: [{ unique: true, fields: ['messageId'] }],
        });
    }
}

module.exports = Suggestion;
