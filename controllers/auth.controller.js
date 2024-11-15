const User = require('../models/user.model');
const { createToken, verifyToken } = require('./../utils/jwt.tools');


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

controller.login = async (req, res, next) => {
    try{
        const {identifier, password} = req.body;
        const user = 
            await User.findOne({ $or: [{ username: identifier }, { email: identifier }] });

        if (!user) {
            return res.status(404).json({ error: "User does not exist" });
        }

        if (!user.comparePassword(password)) {
            return res.status(401).json({ error: "Invalid password" });
        }

        const token = await createToken(user._id);

        let _tokens = [...user.tokens]
        const _verifyPromises = _tokens.map( async (_t) => {
            const status = await verifyToken(_t);
            return status ? _t : null;
        });

       _tokens = (await Promise.all(_verifyPromises))
            .filter(_t => _t)
            .slice(0, 5); 

        _tokens = [token, ..._tokens];
        user.tokens = _tokens;

        await user.save();
        return res.status(200).json({ token });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = controller;