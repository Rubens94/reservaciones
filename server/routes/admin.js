const router = require('express').Router();
const { check } = require('express-validator');
const { jwtVerify } = require('../middlewares/jwtVerify');
const { fieldsValidate } = require('../middlewares/fieldsValidate');
const UserController = require('../controllers/users');

router.post('/', [
    jwtVerify,
    check('name', 'Name cannot be empty').not().isEmpty().trim().escape(),
    check('name', 'The name must be string').isString().trim().escape(),
    check('lastname', 'Lastname cannot be empty').not().isEmpty().trim().escape(),
    check('lastname', 'The lastname must be string').isString().trim().escape(),
    check('roleId', 'roleId cannot be empty').not().isEmpty().trim().escape(),
    check('email', 'Invalid email').isEmail(),
    check('email', 'Email is required').not().isEmpty().trim().escape(),
    check('password', 'Password is required').not().isEmpty().trim(),
    check('password', 'The password must have more than 6 characters').isLength({ min: 6 }),
    fieldsValidate
], UserController.createUsersByAdmin);

module.exports = router;