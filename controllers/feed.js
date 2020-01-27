const {validationResult} = require('express-validator/check');

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
      return res.status(422).json({
        message: 'Validation Failed, entered data is incorrect',
        errors: errors.array()
      });
    }
    const title = req.body.title;
    const content = req.body.content;
    
    // Create post in db
    res.status(201).json({
      message: 'Post created successfully!',
      post: { 
        _id: new Date().getTime(), 
        title, 
        content,
        creator: {name: 'Sehan'},
        createdAt: new Date()
      }
    });
};