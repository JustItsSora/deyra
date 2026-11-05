// src/data/models/MusicVote.js
//
// Votos de top.gg. Es el "monedero" de Deyra sin dinero: en vez de cobrar,
// se pide un voto en top.gg a cambio de desbloquear funciones (más filtros,
// más playlists, más historial). Es el mismo esquema que usaba el bot de
// música viejo, que por eso ya tenía un webhook propio para recibir los votos.
//
// `expiresAt` es hasta cuándo vale el voto: top.gg manda su propio
// expires_at y el voto vale hasta ahí. `voteCount` es para /premium y para
// limpiar los votos viejos del mismo usuario en vez de dejar filas duplicadas.

const { Model, DataTypes } = require('sequelize');

class MusicVote extends Model {
    static init(sequelize) {
        return super.init({
            // El usuario de Discord que votó (platform_id de top.gg). Es la
            // clave: top.gg manda el id de Discord en el payload del webhook.
            userId: { type: DataTypes.STRING, allowNull: false, unique: true },

            // Id del voto en top.gg. Sirve para que el webhook sea idempotente:
            // top.gg reintenta si no receives un 2xx, y sin esto contaría dos.
            lastVoteId: { type: DataTypes.STRING, allowNull: true },
            lastVotedAt: { type: DataTypes.DATE, allowNull: true },
            expiresAt: { type: DataTypes.DATE, allowNull: true },

            // Votos de prueba ("isWeekend" de top.gg) pesan menos.
            weight: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
            voteCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
        }, {
            sequelize,
            modelName: 'MusicVote',
            tableName: 'music_votes',
            indexes: [
                { unique: true, fields: ['userId'] },
                { fields: ['expiresAt'] },
            ],
        });
    }
}

module.exports = MusicVote;
