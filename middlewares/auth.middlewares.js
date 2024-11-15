const debug = require('debug')('app:auth-middleware');
const { verifyToken } = require('../utils/jwt.tools');
const User = require('../models/user.model');

const middlewares = {};
const PREFIX = 'Bearer';

middlewares.authentication = async(req, res, next) => {
    try{
        const { authorization } = req.headers;

        if (!authorization) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const [prefix, token] = authorization.split(" ");

        if (prefix !== PREFIX) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        if (!token) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const payload = await verifyToken(token);
        if (!payload) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const userId = payload.sub;

        const user = await User.findById(userId);
        
        if (!user) {
            return res.status(401).json({ error: "User not authenticated" });
        }

        const isTokenValid = user.tokens.includes(token);
        if (!isTokenValid) {
            return res.status(401).json({ error: "User not authenticated" });
        }
        req.user = user;
        req.token = token;
        next();
    }
    catch(error){
        console.error(error);
        return res.status(500).json({ error: "Internal Server Error" });
    }
}

module.exports = middlewares;