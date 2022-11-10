const router = require('express').Router();
const { check } = require('express-validator');
const { jwtVerify } = require('../middlewares/jwtVerify');
const { fieldsValidate } = require('../middlewares/fieldsValidate');
const BookingController = require('../controllers/bookings')

module.exports = router;

router.post('/', [
    jwtVerify,
    check('roomId', 'Name cannot be empty').not().isEmpty().trim().escape(),
    check('start', 'Name cannot be empty').not().isEmpty().trim().escape(),
    check('end', 'Name cannot be empty').not().isEmpty().trim().escape(),
    check('observations').trim().escape(),
    fieldsValidate
], BookingController.createBooking);

router.put('/', [
    jwtVerify,
    check('id', 'ID cannot be empty').not().isEmpty().trim().escape(),
    check('end', 'Name cannot be empty').not().isEmpty().trim().escape(),
    fieldsValidate
], BookingController.updateBookingById);

router.delete('/:id', [jwtVerify], BookingController.deleteBookingById);

router.get('/', BookingController.getBookings);
