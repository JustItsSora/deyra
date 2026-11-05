// src/data/models/MusicFavorite.js
//
// Canciones guardadas por el usuario (/favourite). En el bot viejo esto vivía
// dentro de la tabla `music` como un JSONB, lo que hacía imposible consultar
// "¿quién guardó esto?" o contar favoritos sin traerse el JSON entero. Acá es
// una fila por canción.
//
// El par (userId, identifier) es único: guardar dos veces la misma canción no
// crea duplicado, /favourite avisa que ya estaba y la segunda vez la saca.

const { Model, DataTypes } = require('sequelize');

class MusicFavorite extends Model {
    static init(sequelize) {
        return super.init({
            userId: { type: DataTypes.STRING, allowNull: false },
            identifier: { type: DataTypes.STRING, allowNull: false },
            title: { type: DataTypes.STRING, allowNull: false },
            uri: { type: DataTypes.STRING, allowNull: true },
            author: { type: DataTypes.STRING, allowNull: true },
            length: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            thumbnail: { type: DataTypes.STRING, allowNull: true },
            source: { type: DataTypes.STRING, allowNull: true },
        }, {
            sequelize,
            modelName: 'MusicFavorite',
            tableName: 'music_favorites',
            indexes: [
                { unique: true, fields: ['userId', 'identifier'] },
                { fields: ['userId'] },
            ],
        });
    }
}

module.exports = MusicFavorite;
