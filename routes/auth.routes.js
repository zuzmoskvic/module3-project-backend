const express = require('express');
const router = express.Router();
const axios = require('axios');
const fs = require('fs')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require("../models/User.model");
const Record = require("../models/Record.model")
const { isAuthenticated: enrichRequestWithUser } = require('../middlewares/jwt.auth');
const uploader = require('../middlewares/cloudinary.config.js');
const { Configuration, OpenAIApi, TranscriptionsApi } = require('openai');
const FormData = require('form-data');
const path = require('path');


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



router.post('/addRecord', enrichRequestWithUser, uploader.single("recordPath"), async (req, res, next) => {
  try {
    
    const record = new Record({
      title: req.body.title,
      recordPath: req.file.path,
    });
    await record.save();

    // Associate the record with the user
    const user = await User.findByIdAndUpdate(
      req.payload._id,
      { $push: { records: record._id } },
      { new: true }
    )

   // const filePath = path.join(__dirname, "audio.mp3");
    const model = "whisper-1";
    const formData = new FormData();
    formData.append("model", model);


    const createReadableStreamFromUrl = async (url) => {
      const response = await axios.get(url, { responseType: 'stream' });
      return response.data;
    }; 

    const remoteUrl = req.file.path;
    console.log("",record);

    const readStream = createReadableStreamFromUrl(remoteUrl);

    formData.append("recordPath", readStream);

    axios.post("https://api.openai.com/v1/audio/transcriptions", formData, 
      {
        headers: {
          ...formData.getHeaders(),
          'authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`
        },
      })
      .then((response)=> {
        console.log(response.data);
      });

   
  } catch (err) {
    console.error(err);
    // Handle the error appropriately
    res.status(500).json({ error: 'An error occurred' });
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