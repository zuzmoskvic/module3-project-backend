
const User = require("../models/User.model");
const Record = require("../models/Record.model")
const bcrypt = require("bcryptjs");
const router = require("express").Router();
const jwt = require("jsonwebtoken");
const {
  isAuthenticated: enrichRequestWithUser,
} = require("../middlewares/jwt.auth");

const saltRounds = 13;

router.post("/signup", async (req, res) => {
  //   console.log("Here is the body, from signup post", req.body);
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
router.post("/addRecord", async (req, res, next) => {
  try {
    const record = await Record.create({
      task: req.body.task,
      record: req.body.record,
    });
    
    res.status(201).json(record);
    console.log("Your record", record);

    const foundUser = await User.findOne({ email: req.body.email });
    if (foundUser) {
      foundUser.record.push(record);
      await foundUser.save();
      console.log("User's records updated", foundUser.record);
     
    }
  } catch (err) {
    console.log(err);
  }
});
//this is the verify route for protected page of your app
router.get("/verify", enrichRequestWithUser, (req, res) => {
  console.log("here is our payload", req.payload);
  const { _id } = req.payload;
  if (req.payload) {
    res.status(200).json({ user: req.payload });
  }
});

const enrichRequestWithPrivateThings = async (req, res, next) => {
  const { _id } = req.payload;
  try {
    const user = await User.findById(_id);
    req.privateThings = user.privateThings;
    
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