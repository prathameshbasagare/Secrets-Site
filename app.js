//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const findOrCreate = require("mongoose-findorcreate");

const app= express();

app.set('view engine','ejs');
app.use(express.static("public"));
app.use(bodyParser.urlencoded({extended:true}));
app.use(session({
    secret:"thisisasecretddcdc",
    resave:false,
    saveUninitialized:false
}));


app.use(passport.initialize());
app.use(passport.session());

mongoose.connect(process.env.MONGO_URL);

const userSchema = new mongoose.Schema({
    email:String,
    password: String,
    googleId:String,
    secret:String
});

userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);
const User = new mongoose.model("User",userSchema);

passport.use(User.createStrategy());
passport.serializeUser((user,done)=>{
    done(null,user.id);
});
passport.deserializeUser((id, done)=>{
    User.findById(id).then((user)=>{
        done(null,user);
    }).catch((err)=>{
        done(err);
    });
}); 

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL:"https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile._json.email);
    User.findOrCreate({ username:profile._json.email,googleId: profile.id}, function (err, user) {
      return cb(err, user);
    });
  } 
));




app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/auth/google",
    passport.authenticate('google', {scope:["profile","email"]})
);

app.get("/auth/google/secrets",
    passport.authenticate('google',{failureRedirect:"/login"}),
    (req,res)=>{
        res.redirect("/secrets");
    }
)

app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/secrets",(req,res)=>{
    User.find({secret:{$ne:null}}).then((foundUsers)=>{
        if(foundUsers){
            res.render("secrets",{usersWithSecrets:foundUsers});
        }
    });
});

app.get("/submit",(req,res)=>{
    if(req.isAuthenticated()){
        res.render("submit");
    }else{
        res.redirect("/login");
    }
})
app.get("/logout",(req,res)=>{
    req.logout((err)=>{
        if(err){
            console.log(err);
            res.redirect("/secrets");
        } else {
            res.redirect("/");
        }
    });
});
app.post("/submit",(req,res)=>{
    const submittedsecret = req.body.secret;
    User.findById(req.user._id).then((foundUser)=>{
        if(foundUser){
            foundUser.secret = submittedsecret;
            foundUser.save().then(()=>{
                res.redirect("/secrets");
            })
        }
    }).catch((err)=>{
        console.log(err);
    })
})
app.post("/register",(req,res)=>{
    User.register({username:req.body.username},req.body.password,(err,user)=>{
        if(err){
            console.log(err)
            res.redirect("/register");
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("secrets");
            });
        }
    })

    
});



app.post("/login",(req,res)=>{
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });

    req.login(user,(err)=>{
        if(err){
            console.log(err);
            res.redirect("/login");
        }else{
            passport.authenticate("local")(req,res,()=>{
                res.redirect("/secrets");
            })
        }
    });


    
})





app.listen("3000",(req,res)=>{
    console.log("Server started on port 3000");
});