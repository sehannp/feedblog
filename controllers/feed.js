const {validationResult} = require('express-validator/check');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
    res.status(200).json({
      posts: [{
        _id: '1',
        title: 'First Post', 
        content: 'This is the first post!',
        imageUrl: 'images/knight.png',
        creator: {
          name: 'Sehan'
        },
        createdAt: new Date()
      }]
    });
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()){
      const error = new Error('Validation Failed, entered data is incorrect');
      error.statusCode = 422;
      throw error;
    }
    const {title,content} = req.body
    const post = new Post({
      title, 
      content,
      imageUrl: 'images/knight.png',
      creator: {name: 'Sehan'}
    })
    post.save()
    .then(result => {
      console.log(result);
      // Create post in db
      res.status(201).json({
        message: 'Post created successfully!',
        post: result
      });
    })
    .catch(err => {
      if(!err.statusCode){
        err.statusCode = 500;
      }
      //throw wont work
      next(err);
    });


};