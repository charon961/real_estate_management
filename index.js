const port = 3000;
const express = require('express');
const app =  express();
const bodyParser= require('body-parser')
const jwt = require('jsonwebtoken')
const bcrypt= require('bcrypt')
const multer  = require('multer')
require('dotenv').config()
console 
const cookieParser = require('cookie-parser');


app.use(express.json())

app.use(express.urlencoded())


app.use(cookieParser());

app.use("/assets", express.static(__dirname + '/assets'));
app.set('view engine','ejs');
app.set('views','./views');

app.use("/",require('./routes'));



app.listen(port,function (err){
      if(err){
        console.log(err)
      }
      else{
         console.log("server running at port "+port)
      }
})