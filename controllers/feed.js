const fs = require('fs');
const path = require('path');

const {validationResult} = require('express-validator/check');

const io = require('../socket')
const Post = require('../models/post');
const User = require('../models/user');
const {clearImage} = require('../util/file');

exports.getPosts = async (req, res, next) => {
  const currentPage = req.query.page || 1;
  const perPage = 2;
  let totalItems;

  try {
    const totalItems = await Post.find().countDocuments()
    const posts = await Post.find()
                        .populate('creator')
                        .sort({createdAt: -1})
                        .skip((currentPage-1) * perPage)
                        .limit(perPage);

    res.status(200).json({
      message: 'fetched posts successfully',
      posts: posts,
      totalItems: totalItems
    });
  }
  catch(err){
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  }
};

exports.createPost = async (req, res, next) => {
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
    const {title,content} = req.body;

    try{
      //userid fetched from the middleware
      const post = await new Post( {title, content,imageUrl, creator: req.userId} ).save();
      const creator = await User.findById(req.userId);
      creator.posts.push(post); //mongoose will extract the id and populate
      await creator.save();
      io.getIO().emit('posts',{ 
        action:'create', 
        post: { ...post._doc, 
                creator:{
                  _id: req.userId, 
                  name:user.name
                }
              } 
      })
      res.status(201).json({
          message: 'Post created successfully!',
          post: post,
          creator: {_id: creator._id, name: creator.name}
        });
    }
    catch(err) {
      if(!err.statusCode){
        err.statusCode = 500;
      }
      next(err);
    };
};

exports.getPost = async (req,res,next) => {
  const postId = req.params.postId;

  try{
    const post = await Post.findById({_id: postId}).populate('creator');
    if(!post){
      const error = new Error('Could not find post');
      error.statusCode = 404;
      throw error;
    }
    res.status(200).json({
      message: 'Post fetched',
      post
    });
  }
  catch(err){  
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  }
}

exports.updatePost = async (req,res,next) => {
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

  try{
    const post = await (await Post.findById(postId)).populate('creator');
    if(!post){
      const error = new Error('Could not find post');
      error.statusCode = 404;
      throw error;
    }

    if(post.creator._id.toString() !== req.userId){
      const error = new Error('Not authorized');
      error.statusCode = 403;
      throw error;
    }

    if (imageUrl !== post.imageUrl){
      clearImage(post.imageUrl);
    }

    post.title = title;
    post.imageUrl = imageUrl;
    post.content = content;

    const result = await post.save();
    io.getIO().emit('posts', {
      action: 'update',
      post: result
    })
    res.status(200).json({
      message: 'post updated!',
      post: result
    })
  }
  catch(err) {
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  }
}


exports.deletePost = async (req,res,next) => {
  const postId = req.params.postId;

  try{
    const post = await Post.findById(postId)
      if(!post){
        const error = new Error('Could not find post');
        error.statusCode = 404;
        throw error;
      }

      if(post.creator.toString() !== req.userId){
        const error = new Error('Not authorized');
        error.statusCode = 403;
        throw error;
      }

    clearImage(post.imageUrl);
    await Post.findByIdAndRemove(postId);
    const user = await User.findById(req.userId);
    await user.posts.pull(postId);
    await user.save()
    io.getIO().emit('posts',{
      action: 'delete',
      post: postId
    });
    res.status(200).json({
      message: 'Deleted Post!'
    });
  }
  catch(err){
    if(!err.statusCode){
      err.statusCode = 500;
    }
    next(err);
  }
}