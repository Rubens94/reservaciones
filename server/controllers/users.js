const bcrypt = require("bcrypt");
const httpCodes = require('../common/httpCodes');
const jwt = require("jsonwebtoken");
const Role = require('../models/roles');
const Users = require('../models/users');

class UserController {
    static async createUser(req, res) {
        const { name, lastname, email, password } = req.body;

        try {
            const user = await Users.findOne({ where: { email } });
    
            if( user ) return res.status(httpCodes.BAD_REQUEST).json({msg: 'the email already exists, try with another.'});
            
            await Users.create({
                name,
                lastname,
                email,
                password
            });
        } catch (err) {
            res.status(httpCodes.INTERNAL_SERVER_ERROR).json({msg: 'Server error, contact administrator'});
        }

        res.status(httpCodes.OK).json({
            msg: 'User created'
        });
    }

    static async login(req, res){
        const { email, password } = req.body;

        const user = await Users.findOne({ where: { email } });
        if( !user ) return res.status(httpCodes.NOT_FOUND).json({msg: 'The mail is not registered.'});

        const validPassword = bcrypt.compareSync( password, user.password );
        if ( !validPassword ) return res.status(httpCodes.BAD_REQUEST).json({msg: 'wrong password'});

        const { id, roleId } = user;
        const token = jwt.sign({ id, roleId }, process.env.JWT_SECRET, { expiresIn: "3h" });

        res.status(httpCodes.OK).json({ token });
    }

    static async getUserWithJWT(req, res){
        const token = req.headers.authorization.split(' ')[1];
        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        const user = await Users.findOne({ 
            where: { id },
            attributes: ['id', 'name', 'lastname', 'email'],
            include: [
                {
                    model: Role,
                    attributes: ['name', 'description']
                }
            ]

        });
        if( !user ) return res.status(httpCodes.NOT_FOUND).json({msg: 'User not found'});

        res.status(httpCodes.OK).json({ user });
    }

    static async updateUserWithJWT(req, res){
        const token = req.headers.authorization.split(' ')[1];
        const { name, lastname, email, password } = req.body;
        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        const user = await Users.findOne({ where: { id } });
        if( !user ) return res.status(httpCodes.NOT_FOUND).json({msg: 'User not found'});

        if ( password ) {
            const newPassword = bcrypt.hashSync(password, bcrypt.genSaltSync(10) );
            user.update({
                name,
                lastname,
                email,
                password: newPassword
            });
        }

        user.update({
            name,
            lastname,
            email
        });

        res.status(httpCodes.OK).json({msg:'Updated user'});
    }

    static async deleteUserWithJWT(req, res){
        const token = req.headers.authorization.split(' ')[1];
        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        const user = await Users.findOne({ where: { id } });
        if( !user ) return res.status(httpCodes.NOT_FOUND).json({msg: 'User not found'});

        user.destroy();
        res.status(httpCodes.OK).json({msg: 'Deleted user'});
    }

    static async getUsersByAdmin(req, res){
        const token = req.headers.authorization.split(' ')[1];
        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        const { roleId } = await Users.findOne({ where: { id } });
        
        if( roleId !== 1 ) return res.status(httpCodes.FORBIDDEN).json({ msg: 'Access denied'});

        const users = await Users.findAll({
            attributes: ['id', 'name', 'lastname', 'email'],
            include: [
                {
                    model: Role,
                    attributes: ['name', 'description']
                }
            ]
        });

        if(!users.length) res.status(httpCodes.NOT_FOUND).json({ msg: 'Users not found'});
        res.status(httpCodes.OK).json({ users });
    }

    static async deleteUserByAdmin(req, res){
        const token = req.headers.authorization.split(' ')[1];
        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        const { roleId } = await Users.findOne({ where: { id } });
        
        if( roleId !== 1 ) return res.status(httpCodes.FORBIDDEN).json({ msg: 'Access denied'});

        try{
            const { idUser } = req.params;
            const user2 = await Users.findOne({ where: { 'id': idUser }});
            if(!user2) return res.status(httpCodes.NOT_FOUND).json({msg: `User with ID: ${idUser}, not found`});
            user2.destroy();
        } catch(err){
            res.status(httpCodes.INTERNAL_SERVER_ERROR).json({msg: 'Server error, contact administrator'});
        }

        res.status(httpCodes.OK).json({msg: 'Deleted user'});
    }

    static async createUsersByAdmin(req, res) {
        const token = req.headers.authorization.split(' ')[1];
        const userToken = jwt.verify(token, process.env.JWT_SECRET);

        const admin = await Users.findOne({ where: { 'id':userToken.id } });
        
        if( admin.roleId !== 1 ) return res.status(httpCodes.FORBIDDEN).json({ msg: 'Access denied'});

        const { name, lastname, roleId, email, password } = req.body;

        try {
            const user = await Users.findOne({ where: { email } });
    
            if( user ) return res.status(httpCodes.BAD_REQUEST).json({msg: 'the email already exists, try with another.'});
            
            await Users.create({
                name,
                lastname,
                roleId,
                email,
                password
            });
        } catch (err) {
            res.status(httpCodes.INTERNAL_SERVER_ERROR).json({msg: 'Server error, contact administrator'});
        }

        res.status(httpCodes.OK).json({
            msg: 'User created'
        });
    }
}

module.exports = UserController;