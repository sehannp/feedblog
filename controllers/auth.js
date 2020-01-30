const User = require('../models/user');
const {validationResult} = require('express-validator/check');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../env/jwt');

exports.signup = async (req,res,next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()){
        const error = new Error('Validation Failed');
        error.data = errors.array();
        error.statusCode = 422;
        throw error;
    }

    try{
        const {email,name,password} = req.body;
        const hashedPassword = await bcrypt.hash(password,12);
        const user = await new User({email,password:hashedPassword,name});
        await user.save();
        res.status(201).json({message: 'User created', userId: result._id});
    }
    catch(err){
        if(!err.statusCode){
          err.statusCode = 500;
        }
        next(err);
    }
};

exports.login = async (req,res,next) => {
    const {email,password} = req.body;

    try{
        const user = await User.findOne({email})
        if(!user){
            const error = new Error('A user with this email not found.');
            error.statusCode = 401; //not authenticated
            throw error;
        }
        const isEqual = await bcrypt.compare(password,user.password);
        if (!isEqual) {
            const error = new Error('Wrong password');
            error.statusCode = 401; //not authenticated
            throw error;
        }
        const token = jwt.sign({
            email:user.email, 
            userId: user._id.toString()
            },JWT_SECRET,{expiresIn: '1h'});
        res.status(200).json({token:token,userId: user._id.toString()})
    }
    catch(err){
        if(!err.statusCode){
          err.statusCode = 500;
        }
        next(err);
    }
}

exports.getUserStatus = async (req, res, next) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
      }
      res.status(200).json({ status: user.status });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };
  
exports.updateUserStatus = async (req, res, next) => {
    const newStatus = req.body.status;
    try {
      const user = await User.findById(req.userId);
      if (!user) {
        const error = new Error('User not found.');
        error.statusCode = 404;
        throw error;
      }
      user.status = newStatus;
      await user.save();
      res.status(200).json({ message: 'User updated.' });
    } catch (err) {
      if (!err.statusCode) {
        err.statusCode = 500;
      }
      next(err);
    }
  };