
const User = require("../models/User.model");
const Record = require("../models/Record.model")
const bcrypt = require("bcryptjs");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const fs = require('fs');
const {
  isAuthenticated: enrichRequestWithUser,
} = require("../middlewares/jwt.auth");
const uploader = require('../middlewares/cloudinary.config.js');


//OpenIA 
import { Configuration, OpenAIApi } from "openai";
const configuration = new Configuration({
    organization: "org-b4uyFKiJq6z0T7mTYu4vqZTa",
    apiKey: process.env.OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);
const response = await openai.listEngines();



router.post("/signup", async (req, res) => {
  
    const saltRounds = 13;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const newUser = await User.create({ email: req.body.email, password: hash });
    console.log("here is our new user in the DB", newUser);
   
    res.status(201).json(newUser);

  
  
  
  
});


//login route
router.post("/login", async (req, res) => {
  try {
    const foundUser = await User.findOne({ email: req.body.email });
    //   console.log("here is the found user", foundUser);
    if (foundUser) {
      const passwordMatch = bcrypt.compareSync(
        req.body.password,
        foundUser.password
      );
      // console.log("the password match! Yay!", passwordMatch);
      if (passwordMatch) {
        //take the info you want from the user without sensetive data
        const { _id, email } = foundUser;
        const payload = { _id, email };
        // Create and sign the token
        const authToken = jwt.sign(payload, process.env.TOKEN_SECRET, {
          algorithm: "HS256",
          expiresIn: "6h",
        });
        console.log("here is my new token", authToken);
        res.status(200).json({ authToken });
      }
    } else {
      //if there is no email in the DB matching
      res.status(400).json({ message: "email or password do not match" });
    }
  } catch (err) {
    console.log(err);
  }
});

//this is the verify route for protected page of your app
router.get("/verify", enrichRequestWithUser, (req, res) => {
  //console.log("here is our payload", req.payload);
  const { _id } = req.payload;
  if (req.payload) {
    res.status(200).json({ user: req.payload });
  }
});

router.post("/addRecord", uploader.single("recordPath"), enrichRequestWithUser, async (req, res, next) => {
  console.log("here is our ID from addRecord", req.payload._id);

  try {
    const record = new Record({
      title: req.body.title,
      recordPath: req.file.path,
     });
     await record.save();
     const user = await User.updateOne(
      { _id: req.payload._id },
      { $push: { record : record._id } }
      
axios.
post('https://api.openapi.com/v1/audio/transcriptions', )

    );


   
   

    res.status(201).json(record);
  } catch (err) {
    console.log(err);
    res.status(500).json({ error: 'An error occurred', details: err.message });
  }
});


const enrichRequestWithPrivateThings = async (req, res, next) => {
  const { _id } = req.payload;
  try {
    const user = await User.findById(_id);
    req.privateThings = user.privateThings;
    console.log("private page", req.payload)
    next();
  } catch (err) {
    console.log(err);
  }
};

router.get(
  "/private-page",
  enrichRequestWithUser,
  enrichRequestWithPrivateThings,
  async (req, res) => {
    res.status(200).json({ privateThings: req.privateThings });
  }
);

router.get(
  "/private-page-2",
  enrichRequestWithUser,
  enrichRequestWithPrivateThings,

  async (req, res) => {
    res.status(200).json({ privateThings: req.privateThings });
  }
);

module.exports = router;