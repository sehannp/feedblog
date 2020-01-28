const path = require('path');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const MONGODB_URI = require('./env/mongoose');
const multer = require('multer');

const bodyParser = require('body-parser');
// const fileStorage = multer.diskStorage({
//     destination: (req,res,cb) => {
//         cb(null, 'images');
//     },
//     filename: (req,res,cb) => {
//         cb(null, new Date().toISOString() + '-' + file.originalname)
//     }
// })
const uuidv4 = require('uuid/v4')
 
const fileStorage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, 'images');
    },
    filename: function(req, file, cb) {
        cb(null, uuidv4())
    }
});

const fileFilter = (req,file,cb) => {
    if (file.mimetype === 'images/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg')
    {
            cb(null,true);
    }
    else{
        cb(null,false);
    }
};

const feedRoutes = require('./routes/feed');
app.get('/favicon.ico', (req, res) => res.status(204));
app.use(bodyParser.json()); 
app.use(multer({storage:fileStorage, fileFilter: fileFilter}).single('image'));

app.use('/images',express.static(path.join(__dirname,'images')));

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST, PUT, PATCH, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    next();
});
app.use('/feed', feedRoutes);

app.use((error,req,res,next) => {
    //for developer
    console.log(error);

    const status = error.statusCode || 500;
    const message = error.message;
    res.status(status).json({
        message: message
    });
});

mongoose.connect(MONGODB_URI)
.then(result => {
    app.listen(8080);
})
.catch(err => {
    console.log(err);
});