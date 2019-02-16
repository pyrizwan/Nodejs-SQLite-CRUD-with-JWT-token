var express = require('express');
var User = require('../models').User;
var router = express.Router();
var jwt     = require('jsonwebtoken');
var ejwt    = require('express-jwt');
var path = require("path");
var env = process.env.NODE_ENV || "development";
var config = require(path.join(__dirname, '..', 'config', 'config.json'))[env];


var jwtCheck = ejwt({
    secret: config.secretKey
  });
  
  function createToken(user) {
   return jwt.sign({username: user.username},
    config.secretKey,
    { expiresIn: '24h'
    }
    );
  }

var checkIDInput = function (req, res, next) {  
    if(isNaN(req.params.id)) {
        res.status(400).json('Invalid ID supplied');
    } else {
        next();
    }
};
var checkIDExist = function (req, res, next) {  
    User.count({ where: { id: req.params.id } }).then(count => {
        if (count != 0) {
            next();
        } else {
            res.status(400).json('Not found');
        }
    }); 
};
router.use('/', jwtCheck,function (err, req, res, next) {
    if (err.name === 'UnauthorizedError') {
      return res.status(403).send(
      {status: false,data:{},message:"invalid token provided."}
      );
    }
  });
  
router.get('/profile', function(req, res){
const decoded = jwt.decode(req.headers.authorization.split(' ')[1])   
    User.findAll({
        where: { username: decoded.username }
    }).then(book => {
        res.status(200).json(book);
    });
});

router.post('/register', function(req, res){
    User.create({
        name: req.body.name,
        username: req.body.username,
        password: req.body.password
       
    }).then(user => {
        /*console.log(User.get({
            plain: true
        }));*/
        res.status(200).json(user);
    }).error(err => {
        res.status(405).json('Error has occured');
    });
});

router.post('/login', function(req, res){
    User.find({
        where: { username: req.body.username }
    }).then(result => {
        if(result)
        {
            if(result.password==req.body.password)
            {
                res.status(200).json({status: true,data: {id_token:createToken(result),username:req.body.username},message:""});
            }
            else
            {
                res.status(200).json({status: false,data: {id_token:"",username:""},message:"Invalid Username/Password"});
            }   
        }
        else
        {
            res.status(200).json({status: false,data: {id_token:"",username:""},message:"Invalid Username/Password"});
        }
        
    }).error(err => {
        res.status(405).json('Error has occured');
    });;
});

module.exports = router;