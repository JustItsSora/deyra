const { Model, DataTypes } = require('sequelize');

class Tag extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            name: { type: DataTypes.STRING, allowNull: false },
            content: { type: DataTypes.TEXT, allowNull: false },
            authorId: { type: DataTypes.STRING, allowNull: false },
            uses: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        }, {
            sequelize,
            modelName: 'Tag',
            tableName: 'tags',
            indexes: [{ unique: true, fields: ['guildId', 'name'] }],
        });
    }
}

module.exports = Tag;
