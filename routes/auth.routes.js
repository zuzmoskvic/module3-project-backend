const express = require("express");
const router = express.Router();
const axios = require("axios");
const fs = require("fs");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const User = require("../models/User.model");
const Text = require("../models/Text.model");
const Record = require("../models/Record.model");
const { isAuthenticated } = require("../middlewares/jwt.auth");
const uploader = require("../middlewares/cloudinary.config.js");
const { Configuration, OpenAIApi, TranscriptionsApi } = require("openai");
const FormData = require("form-data");
const path = require("path");
const imageUploader = require("../middlewares/cloudinary.imageConfig.js");
const multer = require("multer");

const openai = new OpenAIApi(new Configuration({ apiKey: process.env.OPENAI_API_KEY }));

router.post("/signup", imageUploader.single("userImage"), async (req, res) => {
  const saltRounds = 13;
  const salt = bcrypt.genSaltSync(saltRounds);
  const hash = bcrypt.hashSync(req.body.password, salt);
  const newUser = await User.create({ email: req.body.email, userImage: req.file.path, password: hash });
  console.log("here is our new user in the DB", newUser);
  res.status(201).json(newUser);
});

router.post("/login", async (req, res) => {
  try {
    const foundUser = await User.findOne({ email: req.body.email });
    if (foundUser) {
      const passwordMatch = bcrypt.compareSync(
        req.body.password,
        foundUser.password
      );
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

router.get("/verify", isAuthenticated, async (req, res) => {
  try {
    const user = await User.findById(req.payload._id);
    res.status(200).json({ user: user.toObject(), userImage: user.userImage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "An error occurred" });
  }
});

router.get("/transcribe", isAuthenticated, uploader.single("recordPath"), async (req, res, next) => {
    try {
      // Method 1: transcribing a local file, saved in the project directory and then sending it to transcription

      // This is defining the path of the local file:
      const filePath = path.join(__dirname, "../audio.mp3");
      const model = "whisper-1";
      const formData = new FormData();
      formData.append("model", model);
      formData.append("file", fs.createReadStream(filePath));

      const response = axios.post("https://api.openai.com/v1/audio/transcriptions", formData, {
          headers: {
            ...formData.getHeaders(),
            authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
            "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
          },
        })
        .then((response) => {
          console.log(response.data.text);
          const text = response.data.text;
          res.json({ text });
        });
    } catch (err) {
      console.error("error with openai axios call", err);
      res.status(500).json({ error: "An error occurred" });
    }
  }
);

router.post("/profile", isAuthenticated, async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.payload._id);
    user.delete();
    res.status(201).json(user);
    res.status(200).json({ message: "User account deleted successfully" });
    console.log("hi from profile POST");
  } catch (err) {
    console.log("Error deleting user account", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/editUser/:userId", isAuthenticated, async (req, res, next) => {
  console.log("Hello!");
    // try {
      console.log("Hi!");
      const { userId } = req.params;
      console.log("userId from backend: ", userId);

      const user = await User.findById(userId);
      
      console.log( user );
      res.status(200).json(  user  );
  }
);

router.get("/transcribe", isAuthenticated, async (req, res, next) => {
  console.log("Hello from TRANSCRIBE"); 
});

router.get("/addRecord", isAuthenticated, async (req, res, next) => {
  console.log("Hello from ADDRECORD");
});

router.put("/editUser/:userId", isAuthenticated, imageUploader.single("userImage"),  async (req, res, next) => {
  try {
    const {userId} = req.params
    console.log(userId, "id from editUser POST ")
    const userToEdit = await User.findByIdAndUpdate(
      userId,
      { email: req.body.email },
      { new: true }
    );

    res.status(200).json(userToEdit);
  } catch (err) {
    console.log("Error editing user account", err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/addRecord", isAuthenticated, uploader.single("recordPath"), async (req, res, next) => {
    // Method 2: upload a file from user's drive > upload it to cloudinary > then save it to local file in project > send it to be transcribed
    try {
      // Take record from the form and upload it to mongoose
      const record = new Record({ title: req.body.title, recordPath: req.file.path });
      await record.save();

      const recordId = record._id;
      // Associate the record with the user
      await User.findByIdAndUpdate(req.payload._id, { $push: { record: recordId } }, { new: true });

      // Search for the record URL
      const searchedRecord = await Record.findById(recordId);
      const audioUrl = searchedRecord.recordPath;

      // save audio to a local file
      const localFilePath = "./temporary.mp3";
      saveAudioToLocal(audioUrl, localFilePath)
        .then(() => {
          console.log("Audio file saved successfully!");
          sendToApi();
        })
        .catch((error) => {
          console.error("Error saving audio file:", error);
        });

      // define function saveAudioToLocal which creates a stream out of a URL and saves it to a local file
      async function saveAudioToLocal(url, filePath) {
        const writer = fs.createWriteStream(filePath);
        const response = await axios({ url, method: "GET", responseType: "stream" });
        response.data.pipe(writer);
        return new Promise((resolve, reject) => {
          writer.on("finish", resolve);
          writer.on("error", reject);
        });
      }

      // define function sendToApi which sends the file to be transcribed
      async function sendToApi() {
        const filePath = path.join(__dirname, "../temporary.mp3");
        const model = "whisper-1";

        const formData = new FormData();
        formData.append("model", model);
        formData.append("file", fs.createReadStream(filePath));

        axios
          .post("https://api.openai.com/v1/audio/transcriptions", formData, {
            headers: {
              ...formData.getHeaders(),
              authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
              "Content-Type": `multipart/form-data; boundary=${formData._boundary}`,
            },
          })
          .then((response) => {
            const text = response.data.text;
            console.log(text);
            res.json({ text });
            return Record.findByIdAndUpdate(searchedRecord, { transcript: text }, { new: true });
          });
      }
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "An error occurred" });
    }
  }
);

router.get("/write", isAuthenticated, async (req, res, next) => {
  try {
    // Get the last record transcript 
  const user = await User.findById(req.payload._id);
  const lastRecordId = user.record[user.record.length - 1]._id;
  const foundRecord = await Record.findById(lastRecordId);
  const prompt = foundRecord.transcript;

  // Generate OpenAI chat completion
  const completion = await openai.createChatCompletion({
    model: "gpt-3.5-turbo",
    messages: [
        {
          role: "user",
          content: `Hi, can you please write a short feedback text with this context: ${prompt}`,
        },
      ],
    });

    const text = completion.data.choices[0].message.content;

    // Create and save writtenText before sending the response
    const writtenText = await Text.create({ writtenText: text });
    await User.findByIdAndUpdate(req.payload._id, { $push: { writtenText: writtenText._id } }, { new: true });

    res.json({ text });

  } catch (err) {
    console.error("Error with OpenAI Chat Completion", err);
    res.status(500).json({ error: "An error occurred" });
  }
});

const enrichRequestWithPrivateThings = async (req, res, next) => {
  const { _id } = req.payload;
  try {
    const user = await User.findById(_id);
    req.privateThings = user.privateThings;
    console.log("private page", req.payload);
    next();
  } catch (err) {
    console.log(err);
  }
};

// Multer configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, './'); // Specify the directory where you want to save the files
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original filename for saving the file
  },
});
const upload = multer({ storage: storage });

// This route saves a file recorded by user to the project repo
router.post("/record", isAuthenticated, upload.single('audio'), async (req, res, next) => {
  try {
    res.status(200).json({ message: 'File uploaded successfully' });
  } catch (err) {
    next(err);
  }
}
);

// This route displays all recordings of a user
router.get("/display", isAuthenticated, async (req, res, next) => {
  try {
    // Get the last record transcript 
    const user = await User.findById(req.payload._id);
    const lastRecordId = user.record[user.record.length - 1]._id;
    const foundRecord = await Record.findById(lastRecordId);
    const transcript = foundRecord.transcript;
    res.json(transcript);
  } catch (err) {
    next(err);
}}
);

// This route displays all recordings of a user
router.get("/profile", isAuthenticated, async (req, res, next) => {
  try {
    // Get the last record transcript 
    const user = await User.findById(req.payload._id);
    // const lastRecordId = user.record[user.record.length - 1]._id;
    // const foundRecord = await Record.findById(lastRecordId);
    // const transcript = foundRecord.transcript;
    res.json(user);
  } catch (err) {
    next(err);
}}
);

router.get("/private-page", isAuthenticated, async (req, res) => {
  res.status(200).json({ privateThings: req.privateThings });
});

router.get("/private-page-2", isAuthenticated, async (req, res) => {
  res.status(200).json({ privateThings: req.privateThings });
});

module.exports = router;

// Check if the uploaded file is being received correctly
/*
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }*/

// Cleanup: Delete the temporary local file
/*
    fs.unlinkSync(localFilePath);
    res.status(201).json(record);
  } catch (err) {
    console.error(err);
    // Handle the error appropriately
    res.status(500).json({ error: 'An error occurred' });
  }
}) */