const Sequelize = require('sequelize');
const db = require('../config/db');
const Room = require('./rooms');
const Users = require('./users');

const Bookings = db.define('bookings', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    roomId: {
        type: Sequelize.INTEGER
    },
    userId: {
        type: Sequelize.INTEGER
    },
    start: {
        type: Sequelize.DATE
    },
    end: {
        type: Sequelize.DATE
    },
    observations: {
        type: Sequelize.STRING
    },
    job_start: {
        type: Sequelize.STRING
    },
    job_end: {
        type: Sequelize.STRING
    }
});

Bookings.belongsTo(Users, {foreignKey: 'userId'});
Bookings.belongsTo(Room, {foreignKey: 'roomId'});

module.exports = Bookings;