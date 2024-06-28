//jshint esversion:6
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
require("dotenv").config();
const app= express();

app.set('view engine','ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));

mongoose.connect(process.env.mongoURL);

const userSchema = {
    email:String,
    password: String
}

const User = new mongoose.model("User",userSchema);




app.get("/",(req,res)=>{
    res.render("home");
});
app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});


app.post("/register",(req,res)=>{
    const newUser = new User({
        email :req.body.username,
        password:req.body.password
    });
    newUser.save().then(()=>{
        res.render("secrets");
    }).catch((err)=>{
        console.log(err);
    });
});

app.post("/login",(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;
    User.findOne({email:username}).then((foundUser)=>{
        if(foundUser){
            if(foundUser.password === password){
                res.render("secrets");

            }
        }
    }).catch((err)=>{
        console.log(err);
    });
})





app.listen("3000",(req,res)=>{
    console.log("Server started on port 3000");
});