const { Model, DataTypes } = require('sequelize');

class LevelConfig extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false, unique: true },
            enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            announceChannelId: { type: DataTypes.STRING, allowNull: true }, // null = anuncia en el mismo canal
            announceLevelUp: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            xpPerMessageMin: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 15 },
            xpPerMessageMax: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 25 },
            xpCooldownSeconds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60 },
            roleRewards: { type: DataTypes.TEXT, allowNull: false, defaultValue: '{}' }, // JSON { level: roleId }
            ignoredChannels: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
        }, {
            sequelize,
            modelName: 'LevelConfig',
            tableName: 'level_configs',
            indexes: [{ unique: true, fields: ['guildId'] }],
        });
    }
}

module.exports = LevelConfig;
