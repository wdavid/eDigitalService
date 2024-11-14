const User = require('../models/user.model');

const controller = {};

controller.register = async (req, res, next) => {
    try {
        const { username, email, fechaNacimiento, metaconsumo,  password } = req.body;

        const user = 
            await User.findOne({ $or: [{ username: username }, { email: email }] });
        if (user) {
            return res.status(400).json({ error: "User already exists" });
        }

        const newUser = new User({
            username: username,
            email: email,
            fechaNacimiento: fechaNacimiento,
            metaconsumo: metaconsumo,
            password: password,
        })

        await newUser.save();

        return res.status(201).json({message: "User created successfully"});
    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = controller;