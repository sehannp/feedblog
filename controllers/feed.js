const {validationResult} = require('express-validator/check');

const Post = require('../models/post');

exports.getPosts = (req, res, next) => {
  Post.find()
  .then(posts => {
    res.status(200).json({
      message: 'fetched posts successfully',
      posts: posts
    });
  })
  .catch(err => {
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  });
};

exports.createPost = (req, res, next) => {
    const errors = validationResult(req);
    
    if (!errors.isEmpty()){
      const error = new Error('Validation Failed, entered data is incorrect');
      error.statusCode = 422;
      throw error;
    }
    if(!req.file){
      const error = new Error('No image provided/invalid file format');
      error.statusCode = 422;
      throw error;
    }
    const imageUrl = req.file.path.replace("\\" ,"/");
    const {title,content} = req.body
    const post = new Post({
      title, 
      content,
      imageUrl,
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
      next(err);
    });
};

exports.getPost = (req,res,next) => {
  const postId = req.params.postId;

  Post.findById({_id: postId})
  .then(post => {
    if(!post){
      const error = new Error('Could not find post');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: 'Post fetched',
      post
    });
  })
  .catch(err => {
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  });
}
exports.updatePost = (req,res,next) => {
  const postId = req.params.postId;
  const errors = validationResult(req);
    
  if (!errors.isEmpty()){
    const error = new Error('Validation Failed, entered data is incorrect');
    error.statusCode = 422;
    throw error;
  }

  const {title, content} = req.body;
  let imageUrl = req.body.image;

  if (req.file){
    imageUrl = req.file.path.replace("\\","/");
  }
  if (!imageUrl){
    const error = new Error('No file picked');
    error.statusCode = 442;
    throw error;
  }

  Post.findById(postId)
  .then(post => {
    if(!post){
      const error = new Error('Could not find post');
      error.statusCode = 404;
      throw error;
    }
    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;
    return post.save();
  })
  .then(result => {
    res.status(200).json({
      message: 'post updated!',
      post: result
    })
  })
  .catch(err => {
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  })
}