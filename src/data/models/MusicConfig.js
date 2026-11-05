// src/data/models/MusicConfig.js
//
// Ajustes de música POR SERVIDOR. Es el equivalente de la tabla `guilds` del
// bot de música viejo (default_volume, twenty_four_seven, fairplay_default,
// autoplay_default, fairplay_mod_role_id), peroshrunk a solo lo que Deyra usa.
//
// Un solo registro por guild: se busca con `MusicConfig.findOne({ guildId })`
// y se crea on demand. Los valores por defecto NO viven acá sino en
// src/config.js (MUSIC), así que si mañana cambiás un default en el código
// no queda ningún servidor con el valor viejo clavado en la base.

const { Model, DataTypes } = require('sequelize');

class MusicConfig extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false, unique: true },

            // Volumen con el que se crea el player (0-100).
            defaultVolume: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 80 },

            // Autoplay: cuando la cola se vacía, sigue con canciones parecidas
            // en vez de cortar.
            defaultAutoplay: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },

            // FAIRPLAY: el bot solo reproduce para miembros con un rol concreto
            // (fairplayRoleId). Es lo que usan los servidores con "horario"
            // para limitar la música a un grupo cerrado.
            defaultFairplay: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            fairplayRoleId: { type: DataTypes.STRING, allowNull: true },

            // 24/7: canal de voz (y de texto) donde el bot puede quedarse
            // solo, sin nada más en el canal, y seguir sonando.
            twentyFourSeven: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            voice247Id: { type: DataTypes.STRING, allowNull: true },
            text247Id: { type: DataTypes.STRING, allowNull: true },

            // Tiempos de espera antes de irse, en ms. 0 = nunca se va solo.
            leaveOnEmptyMs: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 60000 },
            leaveOnEndMs: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 120000 },

            // Historial de canciones (lo usa /history y /favourites).
            historyEnabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

            // Mostrar el panel "Now Playing" con botones en cada canción.
            nowPlayingPanel: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },

            // Tope de canciones en la cola.
            maxQueueSize: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 500 },
        }, {
            sequelize,
            modelName: 'MusicConfig',
            tableName: 'music_configs',
            indexes: [{ unique: true, fields: ['guildId'] }],
        });
    }
}

module.exports = MusicConfig;
