const express = require('express')
const router = express.Router();




router.use("/admin",require('./admin'));
router.use("/user",require('./user'));

// router.get("/",function(req,res){
//       res.send("hello");

//       return res.send(200);
// })


module.exports=router