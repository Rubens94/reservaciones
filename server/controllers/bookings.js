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
const { uuid } = require('uuidv4');

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
        const job_start = uuid();
        const job_end = uuid();
        await Bookings.create({
            roomId,
            userId: id,
            start,
            end,
            observations,
            job_start,
            job_end
        });

        const startDate = new Date(start);
        const endDate = new Date(end);

        schedule.scheduleJob(job_start, startDate, async () => {
            room.update({
                reserved: 1
            });
        });

        schedule.scheduleJob(job_end, endDate, async () => {
            room.update({
                reserved: 0
            });
        });

        res.status(httpCodes.OK).json({ msg: 'Room reserved' });
    }

    static async updateBookingById(req, res){
        const token = req.headers.authorization.split(' ')[1];
        const userToken = jwt.verify(token, process.env.JWT_SECRET);
        const { id,  end } = req.body;

        const booking = await Bookings.findOne({ where: { id } });
        const { name } = await Role.findOne({ where: { 'id': userToken.id } });
        
        if(!booking) return res.status(httpCodes.NOT_FOUND).json({ msg: 'Booking not found' });
        if(booking.userId !== userToken.id && name !== 'Admin') return res.status(httpCodes.FORBIDDEN).json({ msg: 'Access denied'});

        const room = await Room.findOne({ where: { 'id': booking.roomId } });
        if(!room) return res.status(httpCodes.NOT_FOUND).json({ msg: 'Room not found' });

        schedule.cancelJob(booking.job_end);

        const endDate = new Date(end);
        const job_end = uuid();
        schedule.scheduleJob(job_end, endDate, async () => {
            room.update({
                reserved: 0,
            });
        });
        
        booking.update({
            end,
            job_end
        });

        res.status(httpCodes.OK).json({ msg: 'Booking modified'});
    }

    static async deleteBookingById(req, res){
        const token = req.headers.authorization.split(' ')[1];
        const userToken = jwt.verify(token, process.env.JWT_SECRET);
        const { id } = req.params;

        const booking = await Bookings.findOne({ where: { id } });
        const { name } = await Role.findOne({ where: { 'id': userToken.id } });

        if(!booking) return res.status(httpCodes.NOT_FOUND).json({ msg: 'Booking not found' });
        if(booking.userId !== userToken.id && name !== 'Admin') return res.status(httpCodes.FORBIDDEN).json({ msg: 'Access denied'});

        schedule.cancelJob(booking.job_start);
        schedule.cancelJob(booking.job_end);

        booking.destroy();
        res.status(httpCodes.OK).json({ msg: 'Booking deleted'});
    }

    static async getBookings(req, res){
        const { start, end, roomId} = req.query;
        let page = Number.parseInt(req.query.page);
        const roomsPerPage = 100;
        if(!page || page <= 0) {
            page = 1;
        }

        if( start && end ) {
            const firstDate = `${start} 00:00:00`;
            const secondDate = `${end} 23:59:59`;
            let bookings;
            let total;
            let back;
            let next;
            let pages;
            const roomsPerPage = 100;
            if( roomId ) {
                bookings = await Bookings.findAll({
                    limit: roomsPerPage,
                    offset: roomsPerPage * (page-1),
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
                total = await Bookings.count({
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

                pages = Math.ceil(total / roomsPerPage);

                if(page == 1){
                    back = `${process.env.HOST}/api/bookings?page=1&start=${start}&end=${end}&roomId=${roomId}`;
                } else {
                    back = `${process.env.HOST}/api/bookings?page=${page - 1}&start=${start}&end=${end}&roomId=${roomId}`;
                }

                if(page >= pages) {
                    next = `${process.env.HOST}/api/bookings?page=${pages}&start=${start}&end=${end}&roomId=${roomId}`;
                } else {
                    next = `${process.env.HOST}/api/bookings?page=${page + 1}&start=${start}&end=${end}&roomId=${roomId}`;
                }

            } else {
                bookings = await Bookings.findAll({
                    limit: roomsPerPage,
                    offset: roomsPerPage * (page-1),
                    attributes: [
                        'id', 
                        'roomId', 
                        'userId', 
                        [Sequelize.fn("DATE_FORMAT", Sequelize.col("start"), "%Y-%m-%d %H:%i:%s"), "start"], 
                        [Sequelize.fn("DATE_FORMAT", Sequelize.col("end"), "%Y-%m-%d %H:%i:%s"), "end"], 
                        'observations' 
                    ],
                    where : {
                        'start': {
                            [Op.between] : [firstDate, secondDate]
                        }
                    }
                });
                total = await Bookings.count({
                    attributes: [
                        'id', 
                        'roomId', 
                        'userId', 
                        [Sequelize.fn("DATE_FORMAT", Sequelize.col("start"), "%Y-%m-%d %H:%i:%s"), "start"], 
                        [Sequelize.fn("DATE_FORMAT", Sequelize.col("end"), "%Y-%m-%d %H:%i:%s"), "end"], 
                        'observations' 
                    ],
                    where : {
                        'start': {
                            [Op.between] : [firstDate, secondDate]
                        }
                    }
                });

                pages = Math.ceil(total / roomsPerPage);

                if(page == 1){
                    back = `${process.env.HOST}/api/bookings?page=1&start=${start}&end=${end}`;
                } else {
                    back = `${process.env.HOST}/api/bookings?page=${page - 1}&start=${start}&end=${end}`;
                }

                if(page >= pages) {
                    next = `${process.env.HOST}/api/bookings?page=${pages}&start=${start}&end=${end}`;
                } else {
                    next = `${process.env.HOST}/api/bookings?page=${page + 1}&start=${start}&end=${end}`;
                }
            }

            if (!bookings.length) return res.status(httpCodes.NOT_FOUND).json({ msg: 'unregistered bookings'});

            res.status(httpCodes.OK).json({
                total,
                pages,
                back,
                next,
                bookings
            });
        } else {
            const bookings = await Bookings.findAll({
                limit: roomsPerPage,
                offset: roomsPerPage * (page-1),
                attributes: [
                    'id', 
                    'roomId', 
                    'userId', 
                    [Sequelize.fn("DATE_FORMAT", Sequelize.col("start"), "%Y-%m-%d %H:%i:%s"), "start"], 
                    [Sequelize.fn("DATE_FORMAT", Sequelize.col("end"), "%Y-%m-%d %H:%i:%s"), "end"], 
                    'observations' 
                ]
            });
            if (!bookings.length) return res.status(httpCodes.NOT_FOUND).json({ msg: 'unregistered bookings'});

            let back;
            let next;

            const total = await Bookings.count();
            const pages = Math.ceil(total / roomsPerPage);

            if(page == 1){
                back = `${process.env.HOST}/api/bookings?page=1`;
            } else {
                back = `${process.env.HOST}/api/bookings?page=${page - 1}`;
            }

            if(page >= pages) {
                next = `${process.env.HOST}/api/bookings?page=${pages}`;
            } else {
                next = `${process.env.HOST}/api/bookings?page=${page + 1}`;
            }

            res.status(httpCodes.OK).json({
                total,
                pages,
                back,
                next,
                bookings
            });
        }
    }
}

module.exports = BookingController;