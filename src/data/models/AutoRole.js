const { Model, DataTypes } = require('sequelize');

class AutoRole extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false, unique: true },
            roleIds: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' }, // JSON array, se asignan todos al entrar
            botRoleIds: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' }, // roles solo para bots que entran
        }, {
            sequelize,
            modelName: 'AutoRole',
            tableName: 'auto_roles',
            indexes: [{ unique: true, fields: ['guildId'] }],
        });
    }
}

module.exports = AutoRole;
