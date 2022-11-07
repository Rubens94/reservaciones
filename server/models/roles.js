const Sequelize = require('sequelize');
const db = require('../config/db');

const Role = db.define('roles', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true,
    },
      description: {
        type: Sequelize.STRING,
        allowNull: false,
    }
});

module.exports = Role;