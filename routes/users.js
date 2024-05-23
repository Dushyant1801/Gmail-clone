const mongoose = require('mongoose');
const plm = require('passport-local-mongoose');

mongoose.connect("mongodb://localhost/testdbdb");

const userSchema = mongoose.Schema({
  name: String,
  username: String,
  password: String,
  profilePic:{
    type:String,
    default:"dev.jpg"
  },
  email:{
    type: String,
    unique: true
  },
  secret:String,
  sentmails:[{
    type: mongoose.Schema.Types.ObjectId,
    ref:"mail"
  }],
  recievedmails:[{
    type: mongoose.Schema.Types.ObjectId,
      ref:"mail"
  }],
});

userSchema.plugin(plm);

module.exports = mongoose.model("user", userSchema);
