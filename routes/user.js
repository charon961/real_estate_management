const express = require('express')
const router = express.Router();
const adminController = require('../controllers/adminController');
const authenticate= require('../config/middleware')
const jwt = require('jsonwebtoken')
const db = require('../config/db')
const bcrypt= require('bcrypt')
const multer  = require('multer')
const accountSid = 'AC448ee907c0a7eef7daa0a371386d7e3a';
const authToken = '7a84b2e4014a6edd132f9be6bb468080';
const client = require('twilio')(accountSid, authToken);
require('dotenv').config()




function generateOtp() {
    // Generate a random 4-digit number
    const otp = Math.floor(1000 + Math.random() * 9000);
    return otp.toString(); // Convert the number to string
}
const verifyToken=function(req,res,next){
   console.log("here",req.cookies.token);
    const token = req.cookies.token;
    console.log(token)
    if (!token) {
        res.redirect('/user/signup')
     //   return res.status(401).json({ error: 'Token is missing' });
    }

    jwt.verify(token, process.env.TOKEN_SECRET, (err, decoded) => {
        if (err) {
            res.redirect('/user/signup')
           // return res.status(403).json({ error: 'Failed to authenticate token' });
        }
        
        req.user = decoded;
        next();
    });
 

}

router.get('/signup',function(req,res){
    return  res.render('signup')
})
router.post('/createUser', async function (req, res) {
   
    try{

        let email = req.body.email;
        let password = req.body.password;
        let phone = req.body.phone;
        let name=req.body.name;
        let age =req.body.age;
        const salt = await bcrypt.genSalt(10);
        // Hash the password with the salt
        const hashedPassword = await bcrypt.hash(password, salt);
    
        let query = "SELECT * FROM `real_estate_management`.`user` WHERE phone=? OR email = ?";
        let result = await db.commonQuery(query, [phone, email]);
        if (result.length > 0) {
            return res.status(401).json({error: "User with this phone or email number already registered!" });
    
        } else {

            //need to handle case of phone number used again
            let InQ = "INSERT INTO `real_estate_management`.`user` (`email`,`password`,`phone`,`isValid`,`name`,`age`) VALUES (?,?,?,?,?,?)";
            await db.commonQuery(InQ, [email, hashedPassword, phone, 0,name,age]);
         //   res.status(200).json({ message: "User created successfully!" });
            res.redirect('/user/loginpage');
           
        }

    }
    catch(err){
          console.log(err);

    }
 
});
router.get('/loginpage',function(req,res){
      res.render('login')

})

router.use("/login",async function (req,res){
    const { email, password } = req.body;
    
     
    let query= "SELECT * FROM `real_estate_management`.`user` WHERE email= ?";
    let result=await db.commonQuery(query,[email]);
    console.log(result);

    if(result.length==0){
    return res.status(200).json({message:"No valid user found"});
    }
    else{
        const hashedPassword = result[0]["password"];
        const isPasswordMatch = await bcrypt.compare(password, hashedPassword);
        if(!isPasswordMatch){  return res.status(200).json({message:"wrong password"});}
            const token = jwt.sign({ email: result[0]["email"] }, process.env.TOKEN_SECRET, { expiresIn: '10m' });
            res.cookie('token', token, { maxAge: 60*1000*5, httpOnly: true });
            res.redirect('/user/dashboard')
         //   return res.status(200).json({token});

    }
 
    
});



router.get('/dashboard',verifyToken, async function (req, res) {
    let data=[];
    try{
      let email =req.user.email;
      let query = "SELECT * FROM `real_estate_management`.`user` WHERE email = ? "
      let user= await db.commonQuery(query,[email])
      let userID=user[0]["userID"];
      let list = "SELECT * FROM `real_estate_management`.`properties` WHERE userID!=? ORDER BY `likes` DESC LIMIT 10"
       data= await db.commonQuery(list,[userID])

    }catch(err){
        console.log(err);
    }
    if(data.length>0){
        console.log("data",data[0].propertyName)
    }

   return res.render('dashboard',{data:data});
  
});
router.get('/addproperty',verifyToken, (req, res) => {
    return res.render('addproperty');
   
 });

router.post('/submitProperty',verifyToken, async function(req,res){
    console.log("got here",req.body)
      let email =req.user.email;
      console.log(email);
      let query = "SELECT * FROM `real_estate_management`.`user` WHERE email = ?"
      let user= await db.commonQuery(query,[email])
      let userID=user[0]["userID"];
      const {
        propertyName,
        propertyFor,
        propertyType,
        address,
        city,
        token,
        price,
        description,
        features,
        bedrooms,
        bathrooms,
        size,
    } = req.body;

    const inQ = "INSERT INTO `real_estate_management`.`properties` ( `userID`,`propertyName`,`propertyFor`, `type`, `address`, `city`, `token_money`, `full_amount`,`description`, `special_features`,`bedrooms`, `bathrooms`, `size` ,`status`) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        await db.commonQuery(inQ, [
            userID,
            propertyName,
            propertyFor,
            propertyType,
            address.toLowerCase(),
            city.toLowerCase(),
            token,
            price,
            description.toLowerCase(),
            features.toLowerCase(),
            bedrooms,
            bathrooms,
            size,
            1
        ]);

     
      

      return res.status(200).json({message:"property added successfully"})
})



router.get('/showListedProperties',verifyToken,async function(req,res){
    let email =req.user.email;
    console.log(email);
    let query = "SELECT * FROM `real_estate_management`.`user` WHERE email = ? "
    let user= await db.commonQuery(query,[email])

    let userID=user[0]["userID"];

    let selQ="SELECT * FROM `real_estate_management`.`properties` WHERE userID=?";
    let result= await db.commonQuery(selQ,[userID]);

    return res.status(200).json({list:result});


})

router.get('/searchPage',function(req,res){
    let data=[]
    res.render('search',{list:data})
})

router.get('/searchProperties',verifyToken,async function(req,res){
    let email =req.user.email;
    let data=[];
    let query = "SELECT * FROM `real_estate_management`.`user` WHERE email = ? "
    let user= await db.commonQuery(query,[email])

    let userID=user[0]["userID"];
    let size=req.query.size;
    let city=req.query.city;
    let type= req.query.type;
     //need to add rent and buy filter

    let selQ="SELECT * FROM `real_estate_management`.`properties` WHERE userID!=? AND `size`>=? AND `city`=? AND `type`=?";
    //need to handle more data displayed on the page
    let result= await db.commonQuery(selQ,[userID,size,city,type]);
    if(result.length>0){
        data=result;
    }
    //return res.status(200).json({list:result});
    res.render('search', { list: data });


})



router.get('/logout',function(req,res){
    res.cookie('token', "ew44f43", { maxAge: 60*1000*5, httpOnly: true });

res.redirect('/user/loginpage');
})




router.get('/showProperty/:id',verifyToken,async function(req,res){
    let email =req.user.email;
    let query = "SELECT * FROM `real_estate_management`.`user` WHERE email = ? "
    let user= await db.commonQuery(query,[email])
    let id=req.params.id;
    let data=[];
      
    let sel="SELECT * FROM `real_estate_management`.`properties` WHERE id=?"
    let result=await db.commonQuery(sel,[id]);
    console.log("see",user)
    if(result.length>0){
         data=result[0];
    }
      res.render('propertyDisplay',{data:data,valid:user[0]})
})

router.get('/showOwnerDetails/:ownerID',async function(req,res){
    //check if verified then only share details

       
})

function sendOTP(otp){
    client.messages
    .create({
        body: 'test '+otp,
        from: '+12092484665',
        to: '+917011214319'
    })
    .then(message => console.log(message.sid))

    return


}



router.get('/Sendotp',async function(req,res){
   // let phone =req.body.phone
    try {
        // Generate OTP
        const otp = generateOtp();

        let currentTime = Date.now();
        currentTime=currentTime+5*60*1000;

        console.log(otp,currentTime)
     
      // sendOTP(otp);
      
        const query = 'INSERT INTO real_estate_management.otp_table (otp, expiration_time) VALUES (?, ?)';
        await db.commonQuery(query, [otp, currentTime]);

        res.status(200).json({message:"success"})
           
        
    } catch (error) {
        console.error('Error storing OTP in the database:', error);
       res.status(401).json({message:"error"})
    }

      
})
router.post('/VerifyUser/:userID',async function(req,res){
   // console.log(req.body,req.params.userID,req)
   let otp=req.body.otp;
   let userID=req.params.userID;
   let currentTime=Date.now()
   const query = "SELECT * FROM real_estate_management.otp_table WHERE otp=? AND expiration_time>? ";
   const result = await db.commonQuery(query, [otp, currentTime]);
  if(result.length>0){

    //update all row isvalid to zero where number is this
    //then update this as isvalid=1
    let upQ="UPDATE  `real_estate_management`.`user` SET isValid=1 WHERE userID=?";
    await db.commonQuery(upQ,[userID])
    res.status(200).json({message:"success"})

  }
  else{
      res.status(201).json({message:"Invalid Otp"})
  }


      
})


router.get('/shareDetails/:userID',verifyToken, async function(req,res){
    let userID=req.params.userID;
    let query = "SELECT * FROM `real_estate_management`.`user` WHERE userID=? "
    let user= await db.commonQuery(query,[userID])

    return res.status(200).json({name:user[0]["name"],email:user[0]["email"],phone:user[0]["phone"]})




})

router.get('/ReportAdmin',function(req,res){
      
})



module.exports=router