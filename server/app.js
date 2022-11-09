require('dotenv').config();
const express = require('express');
const cors = require('cors');
const  db = require('./config/db');

port = process.env.PORT;

const roomRouter = require('./routes/rooms');
const userRouter = require('./routes/users');

// Import models
require('./models/users');
require('./models/roles');
require('./models/rooms');

// DB Connection
db.sync()
    .then(() => console.log('DB runing'))
    .catch(error => console.log(error));

const app = express();
app.use(cors());

app.use(express.json());
app.use( express.urlencoded({extended: true}) );

app.use('/api/rooms', roomRouter);
app.use('/api/users', userRouter);

app.listen( port, () => {
    console.log(`Server runing at port: ${ port }`);
});