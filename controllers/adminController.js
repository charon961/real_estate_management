require('dotenv').config()
const jwt = require('jsonwebtoken')

module.exports.loginUser= function(req,res){
        const { username, password } = req.body;
        console.log(username,password)
    
        if (username === "abc" && password === "abc123") {
            const token = jwt.sign({ username: "abc" }, process.env.TOKEN_SECRET, { expiresIn: '10m' });

            res.json({ token });

            res.redirect("/admin/dashboard",)
        } else {
    
            res.status(401).json({ error: 'Invalid username or password' });
        }
   
    
}



