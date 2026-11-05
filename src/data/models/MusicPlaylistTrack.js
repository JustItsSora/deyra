// src/data/models/MusicPlaylistTrack.js
//
// Pistas dentro de una playlist. Puerto de `playlist_tracks` del bot viejo,
// que guardaba un string `encoded` opaco; acá se guardan los campos sueltos
// para poder mostrar la lista sin volver a preguntar a Lavalink (que ya no
// tiene la pista: si la playlist se armó hace un mes, el link puede estar
// caído y aun así querés ver qué había).
//
// `position` es manual (0, 1, 2...) y no un autoincremental, porque el orden
// lo decide el usuario con /playlistmove. Un índice (playlistId, position)
// para no recorrer la tabla entera al listar.

const { Model, DataTypes } = require('sequelize');

class MusicPlaylistTrack extends Model {
    static init(sequelize) {
        return super.init({
            playlistId: {
                type: DataTypes.UUID,
                allowNull: false,
                references: { model: 'music_playlists', key: 'id' },
                onDelete: 'CASCADE',
            },
            position: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },

            // Identificador de la pista en Lavalink (base62). Es la clave real:
            // `uri` puede repetirse entre versiones (live, remaster) y dos
            // entradas con el mismo uri son temas distintos.
            identifier: { type: DataTypes.STRING, allowNull: false },
            title: { type: DataTypes.STRING, allowNull: false },
            uri: { type: DataTypes.STRING, allowNull: true },
            author: { type: DataTypes.STRING, allowNull: true },
            length: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            thumbnail: { type: DataTypes.STRING, allowNull: true },
            source: { type: DataTypes.STRING, allowNull: true },
            requesterId: { type: DataTypes.STRING, allowNull: true },
        }, {
            sequelize,
            modelName: 'MusicPlaylistTrack',
            tableName: 'music_playlist_tracks',
            indexes: [
                { fields: ['playlistId', 'position'] },
                { fields: ['playlistId', 'identifier'] },
            ],
        });
    }
}

module.exports = MusicPlaylistTrack;
