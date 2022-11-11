const db = require('../config/db');
const Sequelize = require('sequelize');

const Room = db.define('rooms', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    location: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    description: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    reserved: {
        type: Sequelize.INTEGER,
        allowNull: false,
    }
});

module.exports = Room;