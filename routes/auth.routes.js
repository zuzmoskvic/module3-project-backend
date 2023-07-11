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


const { pipeline } = require('stream');
const { promisify } = require('util');
const streamifier = require('streamifier');
const pipelineAsync = promisify(pipeline);

//enrichRequestWithUser
router.get('/transcribe', uploader.single("recordPath"), async (req, res, next) => {
  try {
    // Method 1: transcribing a local file, saved in the project directory and then sending it to transcription 

    const OPENAI_API_KEY=process.env.OPENAI_API_KEY;

    // This is defining the path of the local file: 
    const filePath = path.join(__dirname, "../audio.mp3");
    const model = "whisper-1";

    const formData = new FormData();
    formData.append("model", model);
    formData.append("file", fs.createReadStream(filePath));

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
        const text = response.data.text;
        res.json({text});
      });

    } catch (err) {
      console.error("error with openai axios call", err);
      // Handle the error appropriately
      res.status(500).json({ error: 'An error occurred' });
    }
  })


// enrichRequestWithUser
router.post('/addRecord', enrichRequestWithUser, uploader.single("recordPath"), async (req, res, next) => {

  // Method 2: upload a file from user's drive > upload it to cloudinary > then save it to local file in project > send it to be transcribed 

  try {
    // Take record from the form and upload it to mongoose 
    const record = new Record({
      title: req.body.title,
      recordPath: req.file.path,
    });
    await record.save();
    
    // Associate the record with the user
    const user = await User.findByIdAndUpdate(
      req.payload._id,
      { $push: { record: record._id }},
      { new: true }
    );

    // Search for the record URL
    const searchedRecord = await Record.findById(record._id);
    const audioUrl =searchedRecord.recordPath;

    // This functions creates a stream out of a URL and saves it to a local file 
    async function saveAudioToLocal(url, filePath) {
      const writer = fs.createWriteStream(filePath);
    
      const response = await axios({
        url,
        method: 'GET',
        responseType: 'stream',
      });
    
      response.data.pipe(writer);
    
      return new Promise((resolve, reject) => {
        writer.on('finish', resolve);
        writer.on('error', reject);
      });
    }
    
    // Right now this is hard-coded, just to test the functionality of API: 
    //const audioUrl = 'https://res.cloudinary.com/dxqf5r2cu/video/upload/v1688291428/bananarama/whox60hueserufak9ql7.mp3';
    const localFilePath = './temporary.mp3';
    
    saveAudioToLocal(audioUrl, localFilePath)
      .then(() => {
        console.log('Audio file saved successfully!');
        sendToApi();
      })
      .catch((error) => {
        console.error('Error saving audio file:', error);
        
      });

      async function sendToApi() {
          const OPENAI_API_KEY=process.env.OPENAI_API_KEY;
          const filePath = path.join(__dirname, "../temporary.mp3");
          const model = "whisper-1";
      
          const formData = new FormData();
          formData.append("model", model);
          formData.append("file", fs.createReadStream(filePath));
      
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
              const text = response.data.text;
              res.json({text});
            });
      }
      



    // Method - using an audio stream 
    /*
    const audioStream = await axios.get(req.file.path, { responseType: 'stream' });

    const formData = new FormData();
    formData.append('audio', audioStream.data);

    const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': `multipart/form-data; boundary=${formData._boundary}`,
      },
    });

    const transcript = response.data[0]?.text;
    console.log('Transcript:', transcript);*/
  } catch (err) {
    console.error(err);
    // Handle the error appropriately
    res.status(500).json({ error: 'An error occurred' });
  }
})

    // Check if the uploaded file is being received correctly
    /*
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }*/

    
    
    // Metohod - using fs to create a readable stream
    /*
    const model = "whisper-1";
    const formData = new FormData();
    formData.append("model", model);

    const localFilePath = './temp.wav' // Local file path to save the downloaded file
    const response = await axios.get(req.file.path, { responseType: 'stream' });
    await pipelineAsync(response.data, fs.createWriteStream(localFilePath));
    const readStream = fs.createReadStream(localFilePath);
    formData.append("recordPath", readStream);

    axios.post("https://api.openai.com/v1/audio/transcriptions", formData, 
      {
        headers: {
          ...formData.getHeaders(),
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": `multipart/form-data; boundary=${formData._boundary}`
        },
      })
      .then((response) => {
        console.log("This is the response.data", response.data)
      });

    // Cleanup: Delete the temporary local file
    fs.unlinkSync(localFilePath);
    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    // Handle the error appropriately
    res.status(500).json({ error: 'An error occurred' });
  }
}) */


// enrichRequestWithPrivateThings middleware 

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
  // enrichRequestWithPrivateThings,
  async (req, res) => {
    res.status(200).json({ privateThings: req.privateThings });
  }
);

router.get(
  "/private-page-2",
  enrichRequestWithUser,
  //enrichRequestWithPrivateThings,

  async (req, res) => {
    res.status(200).json({ privateThings: req.privateThings });
  }
);

module.exports = router;