const { Model, DataTypes } = require('sequelize');

class AutomodConfig extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false, unique: true },
            enabled: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            antiInvite: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            antiLink: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            antiSpam: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            antiMention: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            antiCaps: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            antiBadWords: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            maxMentions: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
            spamMessageCount: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
            spamIntervalSeconds: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
            capsPercentThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 70 },
            badWordsList: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
            // Dominios que siempre pueden compartirse con antiLink activo.
            // Se comparan por host exacto o subdominio ("youtube.com" permite
            // "www.youtube.com" y "youtu.be" solo si se lista aparte).
            linkAllowlist: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
            whitelistedChannels: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
            whitelistedRoles: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' },
            // Segunda opinión con IA sobre las reglas que pueden ser falsos
            // positivos (palabras prohibidas, mayúsculas). NO se usa para
            // invites ni menciones masivas: un regex ahí es más preciso que
            // cualquier modelo, y la IA gastaría cuota para empeorarlo.
            aiModeration: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
            logChannelId: { type: DataTypes.STRING, allowNull: true },
            punishmentAction: { type: DataTypes.ENUM('delete', 'warn', 'mute', 'kick', 'ban'), allowNull: false, defaultValue: 'delete' },
            // Escalada: si un usuario acumula `escalationThreshold` advertencias
            // en 30 días, se aplica una sanción mayor aunque la acción base sea
            // leve ("solo borrar" + 5 infracciones → silenciar/expulsar/banear).
            // 'off' desactiva la escalada.
            escalationAction: { type: DataTypes.ENUM('off', 'timeout', 'kick', 'ban'), allowNull: false, defaultValue: 'off' },
            escalationThreshold: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 5 },
        }, {
            sequelize,
            modelName: 'AutomodConfig',
            tableName: 'automod_configs',
            indexes: [{ unique: true, fields: ['guildId'] }],
        });
    }
}

module.exports = AutomodConfig;
