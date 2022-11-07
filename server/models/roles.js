const Sequelize = require('sequelize');
const db = require('../config/db');

const Role = db.define('roles', {
    name: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
      description: {
        type: DataTypes.STRING,
        allowNull: false,
    }
});

module.exports = Role;