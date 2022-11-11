const router = require('express').Router();
const { check } = require('express-validator');
const { jwtVerify } = require('../middlewares/jwtVerify');
const { fieldsValidate } = require('../middlewares/fieldsValidate');
const RoomController = require('../controllers/rooms');

router.post('/', [
    jwtVerify,
    check('name', 'Name cannot be empty').not().isEmpty().trim().escape(),
    check('name', 'The name must be string').isString().trim().escape(),
    check('location', 'Name cannot be empty').not().isEmpty().trim().escape(),
    check('location', 'The name must be string').isString().trim().escape(),
    check('description', 'Name cannot be empty').not().isEmpty().trim().escape(),
    check('description', 'The name must be string').isString().trim().escape(),
    fieldsValidate
], RoomController.createRoom);

router.get('/', RoomController.getRooms);

router.get('/search', RoomController.getRoomsByName);

router.delete('/:idRoom', [
    jwtVerify
], RoomController.deleteRoomById);

router.put('/:idRoom', [
    jwtVerify,
    check('name', 'Name cannot be empty').not().isEmpty().trim().escape(),
    check('name', 'The name must be string').isString().trim().escape(),
    check('location', 'Name cannot be empty').not().isEmpty().trim().escape(),
    check('location', 'The name must be string').isString().trim().escape(),
    check('description', 'Name cannot be empty').not().isEmpty().trim().escape(),
    check('description', 'The name must be string').isString().trim().escape(),
    check('reserved', 'reserved cannot be empty').not().isEmpty().trim().escape(),
    check('reserved', 'The reserved must be integer').isDecimal().trim().escape(),
    fieldsValidate
], RoomController.updateRoomById);

module.exports = router;