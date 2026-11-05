const { Model, DataTypes } = require('sequelize');

class GuildConfig extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false, unique: true },
            prefix: { type: DataTypes.STRING, allowNull: true },
            modLogChannelId: { type: DataTypes.STRING, allowNull: true },
            memberLogChannelId: { type: DataTypes.STRING, allowNull: true },
            messageLogChannelId: { type: DataTypes.STRING, allowNull: true },
            muteRoleId: { type: DataTypes.STRING, allowNull: true },
            suggestionsChannelId: { type: DataTypes.STRING, allowNull: true },
            confessionsChannelId: { type: DataTypes.STRING, allowNull: true },
            birthdayChannelId: { type: DataTypes.STRING, allowNull: true },
            language: { type: DataTypes.STRING, allowNull: false, defaultValue: 'es' },
            // Política de contenido del servidor. false = todo SFW (default).
            // Lo cambia /nsfw, que exige permiso de Manage Guild.
            nsfw: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
        }, {
            sequelize,
            modelName: 'GuildConfig',
            tableName: 'guild_configs',
            indexes: [{ unique: true, fields: ['guildId'] }],
        });
    }
}

module.exports = GuildConfig;
