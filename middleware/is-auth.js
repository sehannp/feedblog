const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../env/jwt');

module.exports = (req,res,next) => {
    const authHeader = req.get('authorization');
    if (!authHeader){
        req.isAuth = false;
        return next();
    }

    const token = authHeader.split(' ')[1];
    let decodedToken;
    try{
        decodedToken = jwt.verify(token,JWT_SECRET);
    }
    catch(err){
        err.statusCode = 500;
        req.isAuth = false;
        return next();
    }

    if(!decodedToken){
        req.isAuth = false;
        return next();
    }
    req.userId = decodedToken.userID;
    req.isAuth = true;
    next();
}