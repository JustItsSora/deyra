const { Model, DataTypes } = require('sequelize');

class ShopItem extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false },
            itemId: { type: DataTypes.STRING, allowNull: false }, // slug único dentro del guild
            name: { type: DataTypes.STRING, allowNull: false },
            description: { type: DataTypes.STRING, allowNull: true },
            price: { type: DataTypes.BIGINT, allowNull: false },
            roleId: { type: DataTypes.STRING, allowNull: true }, // si el item otorga un rol al comprarlo
            stock: { type: DataTypes.INTEGER, allowNull: false, defaultValue: -1 }, // -1 = ilimitado
        }, {
            sequelize,
            modelName: 'ShopItem',
            tableName: 'shop_items',
            indexes: [{ unique: true, fields: ['guildId', 'itemId'] }],
        });
    }
}

module.exports = ShopItem;
