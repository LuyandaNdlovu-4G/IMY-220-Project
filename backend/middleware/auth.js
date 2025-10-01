const { ObjectId } = require("mongodb");

const auth = async (req, res, next) => {
    const userId = req.session.userId;

    if (!userId) {
        return res.status(401).json({ message: "You must be logged in." });
    }

    if (!ObjectId.isValid(userId)) {
        return res.status(400).json({ message: "Invalid user ID in session." });
    }

    try {
        const users = req.app.locals.users;

        if (!users) {
            return res.status(500).json({ message: "Users collection not initialized." });
        }

        const user = await users.findOne(
            { _id: new ObjectId(userId) },
            { projection: { password: 0 } } // exclude password
        );

        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }

        req.user = user;
        next();
    } catch (err) {
        console.error("Auth middleware error:", err.stack);
        console.log("Session:", req.session);
        console.log("Session.userId:", req.session?.userId);

        res.status(500).json({ message: "Server error." });
    }
};

module.exports = auth;
