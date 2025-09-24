const User = require("../models/user.model");

const auth = async (req, res, next) => {

    const userId = req.headers["x-user-id"];
    if(!userId){
        return res.status(401).json({ message: "User ID required. (Send in x-user-id header" });
    }

    try{
        const user = await User.findById(userId);
        if(!user) {
            return res.status(404).json({ message: "User not found." });
        }

        req.user = user;
        next();//passes control to the next functio in the middleware
    } catch(err) {
        res.status(500).json({ message: "Server error." });
    }
};

module.exports = auth;