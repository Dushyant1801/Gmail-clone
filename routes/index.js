var express = require('express');
const passport = require('passport');
var router = express.Router();
const userModel = require("./users");
const mailModel = require("./mails");
const multer = require("multer");

const localStrategy = require("passport-local");
passport.use(new localStrategy(userModel.authenticate()));

function fileFilter (req, file, cb) {
  console.log(file);
  if(file.mimetype === "image/jpg" || file.mimetype === "image/png" || file.mimetype === "image/jpeg" || file.mimetype === "image/webp"){
    cb(null , true);
  }
  else{
    cb(new Error("lavde tez mat chal !"));
  }
  
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './public/images/uploads')
  },
  filename: function (req, file, cb) {
    const fn =   Date.now() +Math.floor(Math.random()*1000000) + file.originalname
    cb(null, fn);
  }
})


const upload = multer({ storage: storage, fileFilter:fileFilter })




/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});


router.get('/check/:username', async function(req, res, next) {
  let user =  await userModel.findOne({username: req.params.username})
    res.json({user})
});


router.post('/fileupload', isLoggedIn, upload.single('image'), async function(req, res, next) {
  let loggedinUser =  await userModel.findOne({username: req.session.passport.user})
  loggedinUser.profilePic  = req.file.filename;
  await loggedinUser.save();
  res.redirect(req.headers.referer);
});
router.get("/sentmails",isLoggedIn,async function(req,res,next){
 data = await userModel.findOne({username: req.session.passport.user})
  .populate({
    path: "sentmails",
    populate: {
      path: "userid"
    }
  })
  res.render("sentmails",{foundUser:data})
  console.log(data)
});

router.post("/register", function(req,res,next){
  const userData = new userModel({
    username:req.body.username,
    secret:req.body.secret,
    name:req.body.name,
    email:req.body.email
  });
  userModel.register(userData,req.body.password)
  .then(function(registeredUser){
    passport.authenticate('local')(req,res,function(){
      res.redirect("/login")
    })
  })
  .catch(function(err){
    console.log(err);
    res.redirect("/register");
  })
});
router.get("/login",function(req,res,next){
  res.render("login")
})
router.post('/login', passport.authenticate('local',{
  successRedirect:"/profile",
  failureRedirect:"/login"
  }),function(req,res,next){
  
})

router.get("/profile", isLoggedIn,async function(req,res,next){
  loggedinuser = await userModel.findOne({username: req.session.passport.user})
  .populate({
    path: "recievedmails",
    populate:{
      path: "userid"
    }
  })
    
      // console.log(loggedinuser)
      // foundUser.populate({path:"recievedmails"})
  res.render("profile",{foundUser:loggedinuser})

});
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login")
}

router.post('/compose',isLoggedIn, async function(req , res , next){
  const loggedInUser = await userModel.findOne({username: req.session.passport.user});
  const createdMail  = await mailModel.create({
    userid: loggedInUser._id,
    sentmails: req.body.email,
    mailtext: req.body.mailtext
  });
  loggedInUser.sentmails.push(createdMail._id);
  const updateLoggedInUser = await loggedInUser.save();

  const recieverUser = await userModel.findOne({email: req.body.email});
  recieverUser.recievedmails.push(createdMail._id);

  const updateRecieverUser = await recieverUser.save();
  res.redirect("profile")
})
module.exports = router;
