const bcrypt = require("bcrypt");
const httpCodes = require('../common/httpCodes');
const jwt = require("jsonwebtoken");
const schedule = require('node-schedule');
const Role = require('../models/roles');
const Bookings = require('../models/bookings');
const Room = require('../models/rooms');
const Users = require('../models/users');
const Sequelize = require("sequelize");
const Op = Sequelize.Op;

class BookingController {
    static async createBooking(req, res){
        const token = req.headers.authorization.split(' ')[1];
        const { id } = jwt.verify(token, process.env.JWT_SECRET);

        const { roomId, start, end, observations } = req.body;

        if( new Date(end) - new Date(start) > 7200000 ) return res.status(httpCodes.FORBIDDEN).json({ msg: 'The maximum reservation limit for a room is 2 hours'});

        const room = await Room.findOne({ where: { 'id': roomId } });
        if(!room) return res.status(httpCodes.NOT_FOUND).json({ msg: 'Room not found' });

        const firstDate = `${start.substr(0,10)} 00:00:00`;
        const secondDate = `${end.substr(0, 10)} 23:59:59`;
        const reservations = await Bookings.findAll({
            attributes: [
                'id', 
                'roomId', 
                'userId', 
                [Sequelize.fn("DATE_FORMAT", Sequelize.col("start"), "%Y-%m-%d %H:%i:%s"), "start"], 
                [Sequelize.fn("DATE_FORMAT", Sequelize.col("end"), "%Y-%m-%d %H:%i:%s"), "end"], 
                'observations' 
            ],
            where : {
                roomId,
                'start': {
                    [Op.between] : [firstDate, secondDate]
                }
            }
        });

        for(let i = 0; i <= reservations.length -1; i++){
            console.log(reservations[i].start);
            if(new Date(start) >= new Date(reservations[i].start +1) && new Date(start) <= new Date(reservations[i].end +1) || new Date(end) >= new Date(reservations[i].start +1) && new Date(end) <= new Date(reservations[i].end +1)) return res.status(httpCodes.NOT_FOUND).json({ msg: `The room is already reserved from ${reservations[i].start.substr(11,16)} to ${reservations[i].end.substr(11,16)}. Book another time.`});
        }

        await Bookings.create({
            roomId,
            userId: id,
            start,
            end,
            observations
        });

        const startDate = new Date(start);
        const endDate = new Date(end);

        schedule.scheduleJob(startDate, async () => {
            room.update({
                reserved: 1
            });
        });

        schedule.scheduleJob(endDate, async () => {
            room.update({
                reserved: 0
            });
        });

        res.status(httpCodes.OK).json({ msg: 'Room reserved' });
    }
}

module.exports = BookingController;