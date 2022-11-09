const httpCodes = require('../common/httpCodes');
const jwt = require("jsonwebtoken");
const Room = require('../models/rooms');
const Users = require('../models/users');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

class RoomController {
    static async createRoom(req, res){
        const token = req.headers.authorization.split(' ')[1];
        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        const { roleId } = await Users.findOne({ where: { id } });
        
        if( roleId !== 1 ) return res.status(httpCodes.FORBIDDEN).json({ msg: 'Access denied'});

        const { name, location, description } = req.body;

        try {
            await Room.create({
                name,
                location,
                description,
                reserved: 0
            });
        } catch (err) {
            res.status(httpCodes.INTERNAL_SERVER_ERROR).json({msg: 'Server error, contact administrator'});
        }

        res.status(httpCodes.OK).json({
            msg: 'Room created'
        });
    }

    static async getRooms(req, res){
        let page = Number.parseInt(req.query.page);
        const roomsPerPage = 10;
        if(!page || page <= 0) {
            page = 1;
        }

        const rooms = await Room.findAll({
            limit: roomsPerPage,
            offset: roomsPerPage * (page-1)
        });

        if (!rooms.length) return res.status(httpCodes.NOT_FOUND).json({ msg: 'unregistered rooms'});

        const total = await Room.count();
        const pages = Math.ceil(total / roomsPerPage);

        let back;
        let next;

        if(page == 1) {
            back = `${process.env.HOST}/api/rooms?page=1`;
        } else {
            back = `${process.env.HOST}/api/rooms?page=${page-1}`;
        }

        if(page >= pages) {
            next = `${process.env.HOST}/api/rooms?page=${pages}`;
        } else {
            next = `${process.env.HOST}/api/rooms?page=${page+1}`;
        }

        
        if(!rooms.length) return res.status(httpCodes.NOT_FOUND).json({ msg: 'there are no registered rooms'});
        res.status(httpCodes.OK).json({ 
            total,
            pages,
            back,
            next,
            rooms 
        });
    }

    static async getRoomsByName(req, res){
        const { name } = req.query;
        let page = Number.parseInt(req.query.page);
        const roomsPerPage = 10;
        if(!page || page <= 0) {
            page = 1;
        }

        const rooms = await Room.findAll({
            limit: roomsPerPage,
            offset: roomsPerPage * (page-1),
            where: {
                name: {
                    [Op.like]: `%${name}%`
                }
            }
        });
        
        if (!rooms.length) return res.status(httpCodes.NOT_FOUND).json({ msg: 'unregistered rooms'});

        const total = await Room.count({
            where: {
                name: {
                    [Op.like]: `%${name}%`
                }
            }
        });

        const pages = Math.ceil(total / roomsPerPage);

        let back;
        let next;

        if(page == 1) {
            back = `${process.env.HOST}/api/rooms/search?name=${name}&page=1`;
        } else {
            back = `${process.env.HOST}/api/rooms/search?name=${name}&page=${page-1}`;
        }

        if(page >= pages) {
            next = `${process.env.HOST}/api/rooms/search?name=${name}&page=${pages}`;
        } else {
            next = `${process.env.HOST}/api/rooms/search?name=${name}&page=${page+1}`;
        }

        res.status(httpCodes.OK).json({
            total,
            pages,
            back,
            next,
            rooms 
        });
    }

    static async deleteRoomById(req, res){
        const token = req.headers.authorization.split(' ')[1];
        const { id } = jwt.verify(token, process.env.JWT_SECRET);
        const { roleId } = await Users.findOne({ where: { id } });
        if( roleId !== 1 ) return res.status(httpCodes.FORBIDDEN).json({ msg: 'Access denied'});

        const { idRoom } = req.params;
        
        const room = await Room.findOne({ where: { 'id': idRoom } });
        if(!room) return res.status(httpCodes.NOT_FOUND).json({ msg: 'Room not found' });

        room.destroy();
        res.status(httpCodes.OK).json({ msg: 'Deleted room'});
    }

    static async updateRoomById(req, res){
        const token = req.headers.authorization.split(' ')[1];
        const { id } = jwt.verify(token, process.env.JWT_SECRET);
        const { roleId } = await Users.findOne({ where: { id } });
        if( roleId !== 1 ) return res.status(httpCodes.FORBIDDEN).json({ msg: 'Access denied'});

        const { idRoom } = req.params;
        const { name, location, description, reserved } = req.body;
        const room = await Room.findOne({ where: { 'id': idRoom } });
        if(!room) return res.status(httpCodes.NOT_FOUND).json({ msg: 'Room not found' });

        room.update({
            name,
            location,
            description,
            reserved
        });
        
        res.status(httpCodes.OK).json({ msg: 'Updated room'});
    }

}

module.exports = RoomController;