// src/data/models/MusicHistory.js
//
// Historial de reproducción: una fila por canción QUE SONÓ, no por comando.
// Lo escribe el evento playerStart (src/music/events/playerStart.js), así que
// el historial refleja lo que se escuchó de verdad, aunque el que la pidió
// después sea otro.
//
// Se poda sola: /history solo mira las últimas 50 filas por usuario, y un
// cron (src/lib/backgroundJobs.js) borra lo que tenga más de 30 días. Sin eso
// la tabla crece sin límite en un bot que lleva meses corriendo.

const { Model, DataTypes } = require('sequelize');

class MusicHistory extends Model {
    static init(sequelize) {
        return super.init({
            userId: { type: DataTypes.STRING, allowNull: true },
            guildId: { type: DataTypes.STRING, allowNull: true },
            identifier: { type: DataTypes.STRING, allowNull: false },
            title: { type: DataTypes.STRING, allowNull: false },
            uri: { type: DataTypes.STRING, allowNull: true },
            author: { type: DataTypes.STRING, allowNull: true },
            length: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            thumbnail: { type: DataTypes.STRING, allowNull: true },
            source: { type: DataTypes.STRING, allowNull: true },
            playedAt: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
        }, {
            sequelize,
            modelName: 'MusicHistory',
            tableName: 'music_history',
            indexes: [
                { fields: ['userId', 'playedAt'] },
                { fields: ['guildId', 'playedAt'] },
            ],
        });
    }
}

module.exports = MusicHistory;
