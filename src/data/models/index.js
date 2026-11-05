// src/data/models/index.js
// Inicializa cada modelo contra la conexión de Sequelize y expone un único
// `dbReady` promise que client.js espera antes de hacer login.

const sequelize = require('../sequelize');

const GuildConfig = require('./GuildConfig');
const Economy = require('./Economy');
const ShopItem = require('./ShopItem');
const Leveling = require('./Leveling');
const LevelConfig = require('./LevelConfig');
const TicketConfig = require('./TicketConfig');
const Ticket = require('./Ticket');
const AutomodConfig = require('./AutomodConfig');
const HoneypotConfig = require('./HoneypotConfig');
const AntiNukeConfig = require('./AntiNukeConfig');
const Warn = require('./Warn');
const WelcomeConfig = require('./WelcomeConfig');
const ReactionRole = require('./ReactionRole');
const AutoRole = require('./AutoRole');
const Giveaway = require('./Giveaway');
const Tag = require('./Tag');
const Afk = require('./Afk');
const Reminder = require('./Reminder');
const Birthday = require('./Birthday');
const Suggestion = require('./Suggestion');
const StickyMessage = require('./StickyMessage');
const InteractionCount = require('./InteractionCount');
const Blacklist = require('./Blacklist');

// ── Módulo de música (puerto del bot de música viejo a SQLite) ──────────────
// El bot viejo usaba PostgreSQL + Redis con migraciones SQL propias. Acá todo
// entra por Sequelize como el resto de Deyra: mismas convenciones, cero
// servicios extra, y el `sync()` de abajo crea las tablas que falten.
const MusicConfig = require('./MusicConfig');
const MusicPlaylist = require('./MusicPlaylist');
const MusicPlaylistTrack = require('./MusicPlaylistTrack');
const MusicFavorite = require('./MusicFavorite');
const MusicHistory = require('./MusicHistory');
const UserPremium = require('./UserPremium');
const GuildPremium = require('./GuildPremium');
const MusicVote = require('./MusicVote');

const models = {
    GuildConfig, Economy, ShopItem, Leveling, LevelConfig, TicketConfig, Ticket,
    AutomodConfig, HoneypotConfig, AntiNukeConfig, Warn, WelcomeConfig, ReactionRole, AutoRole, Giveaway, Tag,
    Afk, Reminder, Birthday, Suggestion, StickyMessage, InteractionCount, Blacklist,
    MusicConfig, MusicPlaylist, MusicPlaylistTrack, MusicFavorite, MusicHistory,
    UserPremium, GuildPremium, MusicVote,
};

for (const model of Object.values(models)) {
    model.init(sequelize);
}

module.exports = {
    ...models,
    sequelize,
    dbReady: sequelize.sync(),
};
