const  Sequelize  = require('sequelize');
const db = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
    host: process.env.DB_HOST,
    dialect: 'mysql',
    port: process.env.DB_PORT,
    timezone: '-05:00' 
});

module.exports = db;