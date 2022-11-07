require('dotenv').config();
const express = require('express');
const  db = require('./config/db');

port = process.env.PORT;

// Import models
require('./models/users');

// DB Connection
db.sync()
    .then(() => console.log('DB runing'))
    .catch(error => console.log(error));

const app = express();
app.use( express.urlencoded({extended: true}) );

app.listen( port, () => {
    console.log(`Server runing at port: ${ port }`);
});