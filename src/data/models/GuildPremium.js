// src/data/models/GuildPremium.js
//
// Premium por SERVIDOR: desbloquea /twentyfourseven, /defaultvolume y
// /defaultautoplay. Puerto de la tabla `server_premium` del bot viejo.
//
// OJO con la diferencia: allá el premium de servidor se compraba desde un
// comando del bot y el "dueño" era quien lo había activado (activated_by).
// Acá se mantiene igual porque sirve para dos cosas: mostrar quién lo activó
// en /premium, y saber a quién bolster si hay que desactivarlo.

const { Model, DataTypes } = require('sequelize');

class GuildPremium extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false, unique: true },
            activatedBy: { type: DataTypes.STRING, allowNull: false },
            activatedAt: { type: DataTypes.DATE, allowNull: true },
            expiresAt: { type: DataTypes.DATE, allowNull: true },
        }, {
            sequelize,
            modelName: 'GuildPremium',
            tableName: 'guild_premiums',
            indexes: [{ unique: true, fields: ['guildId'] }],
        });
    }
}

module.exports = GuildPremium;
