const express = require('express')
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate= require('../config/middleware')
const jwt = require('jsonwebtoken')
require('dotenv').config()


const verifyToken=function(req,res,next){
    console.log(req)
    const token = req.headers['authorization'].split(' ')[1];
    console.log(token)
    if (!token) {
        return res.status(401).json({ error: 'Token is missing' });
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ error: 'Failed to authenticate token' });
        }
        
        req.admin = decoded;
        next();
    });
}
router.use("/login",adminController.loginUser);
router.get('/dashboard', verifyToken, (req, res) => {
    res.json({ message: 'Welcome to the admin dashboard!', admin: req.admin });
});



// router.get("/",function(req,res){
//       res.send("hello");

//       return res.send(200);
// })


module.exports=router