const { Model, DataTypes } = require('sequelize');

class WelcomeConfig extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false, unique: true },
            welcomeEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            welcomeChannelId: { type: DataTypes.STRING, allowNull: true },
            welcomeMessage: { type: DataTypes.STRING, allowNull: true, defaultValue: '¡Bienvenido/a {user} a {server}! Ahora somos {membercount} miembros.' },
            welcomeCardEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
            leaveEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            leaveChannelId: { type: DataTypes.STRING, allowNull: true },
            leaveMessage: { type: DataTypes.STRING, allowNull: true, defaultValue: '{user} ha dejado el servidor. Éramos {membercount} miembros.' },
            autoRoleIds: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
        }, {
            sequelize,
            modelName: 'WelcomeConfig',
            tableName: 'welcome_configs',
            indexes: [{ unique: true, fields: ['guildId'] }],
        });
    }
}

module.exports = WelcomeConfig;
