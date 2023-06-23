const router = require("express").Router();
const User = require("../models/User.model");

router.post("/signup", async (req, res) => {
    //console.log("here is my body from signup", req.body);
    const newUser = await User.create(req.body);
    console.log("here is our new user", newUser);
})
module.exports = router;