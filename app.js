const express = require('express');
const app = express();

const bodyParser = require('body-parser');

const feedRoutes = require('./routes/feed');
app.get('/favicon.ico', (req, res) => res.status(204));
app.use(bodyParser.json()); // application/json


app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
app.use('/feed', feedRoutes);

app.listen(8080);