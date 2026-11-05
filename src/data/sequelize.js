// src/data/sequelize.js — conexión ORM. SQLite, cero setup externo.
const path = require('path');
const fs = require('fs');
const { Sequelize } = require('sequelize');
const config = require('../config');

const dbPath = path.resolve(__dirname, '..', '..', config.DATABASE_PATH.replace(/^\.\//, ''));
fs.mkdirSync(path.dirname(dbPath), { recursive: true });

const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: dbPath,
    logging: false,
});

module.exports = sequelize;
