const { Model, DataTypes } = require('sequelize');

class TicketConfig extends Model {
    static init(sequelize) {
        return super.init({
            guildId: { type: DataTypes.STRING, allowNull: false, unique: true },
            categoryId: { type: DataTypes.STRING, allowNull: true },
            logChannelId: { type: DataTypes.STRING, allowNull: true },
            panelChannelId: { type: DataTypes.STRING, allowNull: true },
            panelMessageId: { type: DataTypes.STRING, allowNull: true },
            supportRoleIds: { type: DataTypes.TEXT, allowNull: false, defaultValue: '[]' }, // JSON array
            ticketCounter: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
            welcomeMessage: { type: DataTypes.STRING, allowNull: true },
            panelTitle: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Soporte' },
            panelDescription: { type: DataTypes.STRING, allowNull: true, defaultValue: 'Haz clic en el botón de abajo para abrir un ticket.' },
        }, {
            sequelize,
            modelName: 'TicketConfig',
            tableName: 'ticket_configs',
            indexes: [{ unique: true, fields: ['guildId'] }],
        });
    }
}

module.exports = TicketConfig;
