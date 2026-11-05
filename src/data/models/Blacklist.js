const { Model, DataTypes } = require('sequelize');

class Blacklist extends Model {
    static init(sequelize) {
        return super.init({
            userId: { type: DataTypes.STRING, allowNull: false, unique: true },
            reason: { type: DataTypes.STRING, allowNull: true },
            addedBy: { type: DataTypes.STRING, allowNull: false },
        }, {
            sequelize,
            modelName: 'Blacklist',
            tableName: 'blacklist',
            indexes: [{ unique: true, fields: ['userId'] }],
        });
    }
}

module.exports = Blacklist;
