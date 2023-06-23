const router = require("express").Router();
const User = require("../models/User.model");
const bcrypt = require('bcryptjs')


router.post("/signup", async (req, res) => {
    //console.log("here is my body from signup", req.body);
    const saltRounds = 13;
    const salt = bcrypt.genSaltSync(saltRounds);
    const hash = bcrypt.hashSync(req.body.password, salt);
    const newUser = await User.create({email: req.body.email, password: hash});
    console.log("here is our new user", newUser);

    //send to the front as response to the post, to store the  user in some state after you signup
    res.status(201).json(newUser);
});
router.post("/login", async (req, res) => {
  const foundUser = await User.findOne({email: req.body.email})
    //console.log("here is your found user from the DB ---->>>", foundUser);

    if(foundUser){
        const passwordMatch = bcrypt.compareSync(req.body.password, foundUser.password)
console.log("password match!", passwordMatch)
    }else{
        // res.status(400) means an error coming from the client side, i.e., access denied 
        //because there is no user with an email matching in the DB
res.status(400).json({errorMessage: "Invalid email and/or password."});
    }
});
module.exports = router;