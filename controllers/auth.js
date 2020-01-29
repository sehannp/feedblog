const User = require('../models/user');
const {validationResult} = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../env/jwt');

exports.signup = (req,res,next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        const error = new Error('Validation Failed');
        error.data = errors.array();
        error.statusCode = 422;
        throw error;
    }

    const {email,name,password} = req.body;
    bcrypt.hash(password,12)
    .then(hashedPassword => {
        const user = new User({email,password:hashedPassword,name});
        return user.save();
    })
    .then(result => {
        res.status(201).json({message: 'User created', userId: result._id});
    })
    .catch(err => {
        if(!err.statusCode){
          err.statusCode = 500;
        }
        next(err);
    })
};

exports.login = (req,res,next) => {
    const {email,password} = req.body;
    let loadedUser;
    console.log(email);
    User.findOne({email:email})
    .then(user => {
        if(!user){
            const error = new Error('A user with this email not found.');
            error.statusCode = 401; //not authenticated
            throw error;
        }
        loadedUser = user;
        return bcrypt.compare(password,user.password);
    })
    .then(isEqual => {
        if (!isEqual) {
            const error = new Error('Wrong password');
            error.statusCode = 401; //not authenticated
            throw error;
        }
        const token = jwt.sign({email:loadedUser.email, 
                                userId: loadedUser._id.toString()
                            },JWT_SECRET,{expiresIn: '1h'});
        res.status(200).json({token:token,userId: loadedUser._id.toString()})
    })
    .catch(err => {
        if(!err.statusCode){
          err.statusCode = 500;
        }
        next(err);
    })
}
