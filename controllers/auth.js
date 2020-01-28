const User = require('../models/user');
const {validationResult} = require('express-validator/check');
const bcrypt = require('bcryptjs');

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
}
