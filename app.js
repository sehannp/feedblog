const path = require('path');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const MONGODB_URI = require('./env/mongoose');


const bodyParser = require('body-parser');

const feedRoutes = require('./routes/feed');
app.get('/favicon.ico', (req, res) => res.status(204));
app.use(bodyParser.json()); 
app.use('/images',express.static(path.join(__dirname,'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
app.use('/feed', feedRoutes);

mongoose.connect(MONGODB_URI)
.then(result => {
    app.listen(8080);
})
.catch(err => {
    console.log(err);
});
