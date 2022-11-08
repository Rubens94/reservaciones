const httpCodes = require('../common/httpCodes');
const jwt = require('jsonwebtoken');
const Users = require('../models/users');

const jwtVerify = async(req, res, next) => {
    if (!req.headers.authorization) return res.json({ msg: 'token not found in request' });
    const token = req.headers.authorization.split(' ')[1];

    try {
        const { id } = jwt.verify(token, process.env.JWT_SECRET);
    
        const user = await Users.findOne({ where: { id } });
    
        if (!user) return res.status(httpCodes.NOT_FOUND).json({ msg: 'User not found' });
    
        next();
      } catch (err) {
        res.status(httpCodes.BAD_REQUEST).json({ msg: 'Expired or invalid token' });
    }
}

module.exports = { jwtVerify };