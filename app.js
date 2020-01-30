const path = require('path');
const express = require('express');
const app = express();
const mongoose = require('mongoose');
const MONGODB_URI = require('./env/mongoose');
const multer = require('multer');

const graphqlHttp = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');


const bodyParser = require('body-parser');
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
    if (file.mimetype === 'image/png' || 
        file.mimetype === 'image/jpg' || 
        file.mimetype === 'image/jpeg')
    {
            cb(null,true);
    }
    else{
        cb(null,false);
    }
};

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

app.use('/graphql', graphqlHttp({
    schema: graphqlSchema,
    rootValue: graphqlResolver,
    graphiql:true
}));

app.use((error,req,res,next) => {
    //for developer
    console.log(error);

    const status = error.statusCode || 500;
    const message = error.message;
    const data = error.data;
    res.status(status).json({
        message,data
    });
});

mongoose.connect(MONGODB_URI)
.then(result => {
    app.listen(8080);
})
.catch(err => {
    console.log(err);
});
