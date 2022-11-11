const Sequelize = require('sequelize');
const db = require('../config/db');
const Role = require('./roles');
const bcrypt = require('bcrypt');

const Users = db.define('users', {
    id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: Sequelize.STRING(60),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'name field cannot be empty'
            }
        }
    },
    lastname: {
        type: Sequelize.STRING(60),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'lastname field cannot be empty'
            }
        }
    },
    roleId: {
        type: Sequelize.INTEGER,
        defaultValue: 2
    },
    email: {
        type: Sequelize.STRING(60),
        allowNull: false,
        validate: {
            isEmail: {
                msg: 'Add a valid email'
            },
            notEmpty: {
                msg: 'email field cannot be empty'
            }
        }, 
        unique: {
            args: true,
            msg: 'the email already exists'
        }
    },
    password: {
        type: Sequelize.STRING(60),
        allowNull: false,
        validate: {
            notEmpty: {
                msg: 'No puede ir vació el password'
            }
        }
    },
}, {
    hooks: {
        beforeCreate(user) {
            user.password = bcrypt.hashSync(user.password, bcrypt.genSaltSync(10) );
        }
    }
});

Users.belongsTo(Role, {foreignKey: 'roleId'});

Users.prototype.verificarPassword = function(password) {
    return bcrypt.compareSync(password, this.password);
}

module.exports = Users;