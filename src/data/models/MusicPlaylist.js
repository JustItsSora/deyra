// src/data/models/MusicPlaylist.js
//
// Playlists personales (las que crea cada usuario con /playlistcreate). Puerto
// de la tabla `playlists` del bot viejo: id, user_id, name, track_count.
//
// `trackCount` es un contador desnormalizado a propósito: /playlistlist muestra
// cuántas canciones tiene cada una y count() sobre la tabla de tracks en cada
// fila de la lista es una consulta por playlist. El contador se actualiza en
// playlistService.js, que es el único módulo que escribe tracks.

const { Model, DataTypes } = require('sequelize');

class MusicPlaylist extends Model {
    static init(sequelize) {
        return super.init({
            // Un id propio (no "userId:name") para que se pueda renombrar sin
            // romper las referencias de los tracks.
            id: {
                type: DataTypes.UUID,
                defaultValue: DataTypes.UUIDV4,
                primaryKey: true,
            },
            userId: { type: DataTypes.STRING, allowNull: false },
            name: { type: DataTypes.STRING, allowNull: false },
            description: { type: DataTypes.TEXT, allowNull: true },
            isPublic: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            trackCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        }, {
            sequelize,
            modelName: 'MusicPlaylist',
            tableName: 'music_playlists',
            indexes: [
                { fields: ['userId'] },
                { unique: true, fields: ['userId', 'name'] },
            ],
        });
    }
}

module.exports = MusicPlaylist;
