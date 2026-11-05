const { Model, DataTypes } = require('sequelize');

class Afk extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            userId: { type: DataTypes.STRING, allowNull: false },
            reason: { type: DataTypes.STRING, allowNull: false, defaultValue: 'AFK' },
            mentionCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        }, {
            sequelize,
            modelName: 'Afk',
            tableName: 'afk',
            indexes: [{ unique: true, fields: ['guildId', 'userId'] }],
        });
    }
}

module.exports = Afk;
