const bcrypt = require('bcryptjs');
const validator = require('validator');
const jwt = require('jsonwebtoken');
const JWT_SECRET = require('../env/jwt');

const User = require('../models/user');
const Post = require('../models/post');
const {clearImage} = require('../util/file');

module.exports = {
  createUser: async function({ userInput }, req) {
    //   const email = args.userInput.email;
    
    const errors = [];
    if(!validator.isEmail(userInput.email)){
      errors.push({info: 'Email is invalid'})
    }
    if(validator.isEmpty(userInput.password) || !validator.isLength(userInput.password,{min:5})){
      errors.push({info: 'Password too short'})
    }

    if (errors.length > 0){
      const error = new Error('Invalid input');
      error.data = errors; 
      error.code = 422;
      throw error;
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
      const error = new Error('User exists already!');
      throw error;
    }
    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = new User({
      email: userInput.email,
      name: userInput.name,
      password: hashedPw
    });
    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
  },

  login: async function(args,req){
    const {email,password} = args;
    const user = await User.findOne({email});
    if(!user){
        const error = new Error('User not found');
        error.code = 401;
        throw error;
    }
    const isEqual = await bcrypt.compare(password,user.password);
    if (!isEqual){
      const error = new Error('Password is incorrect');
      error.code = 401;
      throw error;
    }
    const token = jwt.sign({
      userID : user._id.toString(),
      email: user.email
    },JWT_SECRET,{expiresIn: '1h'});
    return {token,userId:user._id.toString()};
  },
  
  createPost: async function({postInput},req){
    
    if (!req.isAuth){
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }

    const {title,content,imageUrl} = postInput;
    const errors = [];

    if (validator.isEmpty(title) || !validator.isLength(title, {min:5})){
      errors.push({info: 'Title is invalid.'});
    }
    if (validator.isEmpty(content) || !validator.isLength(content, {min:5})){
      errors.push({info: 'Content is invalid.'});
    }
    if (errors.length > 0){
      const error = new Error('Invalid input');
      error.data = errors; 
      error.code = 422;
      throw error;
    }

    const user = await User.findById(req.userId);
    if (!user){
      const error = new Error('Invalid User');
      error.code = 401;
      throw error;
    }

    post = new Post({title,content,imageUrl,creator: user});
    const createdPost = await post.save();
    user.posts.push(createdPost);
    await user.save();

    return {
      ...createdPost._doc, 
      _id: createdPost._id.toString(), 
      createdAt: createdPost.createdAt.toISOString(),
      updatedAt: createdPost.updatedAt.toISOString()
    }
  },

  posts: async function({page},req){
    if (!req.isAuth){
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }
    if (!page){
      page =1;
    }
    const PER_PAGE = 2;
    const totalPosts = await Post.find().countDocuments();
    const posts = await Post.find()
      .sort({createUser:-1})
      .skip((page-1)*PER_PAGE)
      .limit(PER_PAGE)
      .populate('creator');
    return ({posts: posts.map(p => {
      return {...p._doc,
              _id:p._id.toString(),
              createdAt: p.createdAt.toISOString(),
              updatedAt: p.updatedAt.toISOString()
            }
    }),
      totalPosts})
  },

  post: async function({id},req){
    if (!req.isAuth){
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id).populate('creator');
    if (!post){
      const error = new Error('No post found');
      error.code = 404;
      throw error;
    }
    return {
      ...post._doc,
      _id: post._id.toString(),
      createdAt: post.createdAt.toISOString(),
      updatedAt: post.updatedAt.toISOString()
    }
  },

  updatePost: async function({id,postInput},req){
    if (!req.isAuth){
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id).populate('creator');
    if (!post){
      const error = new Error('No post found');
      error.code = 404;
      throw error;
    }
    if(post.creator._id.toString() !== req.userId.toString()){
      const error = new Error('Not Authorized');
      error.code = 403;
      throw error;
    }

    const errors = [];
    const {title,content,imageUrl} = postInput;

    if (validator.isEmpty(title) || !validator.isLength(title, {min:5})){
      errors.push({info: 'Title is invalid.'});
    }
    if (validator.isEmpty(content) || !validator.isLength(content, {min:5})){
      errors.push({info: 'Content is invalid.'});
    }
    if (errors.length > 0){
      const error = new Error('Invalid input');
      error.data = errors; 
      error.code = 422;
      throw error;
    }

    post.title = title;
    post.content = content;

    if(imageUrl !== 'undefined'){
      post.imageUrl = imageUrl;
    }
    const updatedPost = await post.save();
    return {
      ...updatedPost._doc, 
      _id: updatedPost._id.toString(), 
      // createdAt: updatedPost.createdAt.toISOString(),
      updatedAt: updatedPost.updatedAt.toISOString()
    }
  },

  deletePost: async function({id},req){

    if (!req.isAuth){
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }
    const post = await Post.findById(id);
    if(!post){
      const error = new Error('No post found');
      error.code = 404;
      throw error;
    }
    // not populating so, creator is the id
    if(post.creator.toString() !== req.userId.toString()){
      const error = new Error('Not Authorized');
      error.code = 403;
      throw error;
    }
    try
    {    
        clearImage(post.imageUrl);
        const c = await Post.findByIdAndRemove(id);
        console.log('c'+c);
        const user = await User.findById(req.userId);
        user.posts.pull(id);
        await user.save();
        return true;
    }
    catch(err){
      console.log(err);
      return false;
    }
  },

  user: async function(args,req){
    if (!req.isAuth){
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if(!user){
      const error = new Error('No user found');
      error.code = 404;
      throw error;
    }    
    return {...user._doc, _id:user._id.toString()};
  },

  updateStatus: async function({status},req){
    if (!req.isAuth){
      const error = new Error('Not Authenticated');
      error.code = 401;
      throw error;
    }
    const user = await User.findById(req.userId);
    if(!user){
      const error = new Error('No user found');
      error.code = 404;
      throw error;
    } 
    user.status = status;
    await user.save();
    return {...user._doc, _id:user._id.toString()}; 
  }
};
