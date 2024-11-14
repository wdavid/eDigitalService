const {SignJWT, jwVerify} = require('jose');

const secret = new TextEncoder().encode(process.env.TOKEN_SECRET || 'secret');
const expTime = process.env.TOKEN_EXP || '15d';

const tools = {}

tools.createToken = async (id) => {
    try {
        const token = await new SignJWT({ id })
            .setProtectedHeader({ alg: 'HS256' }) 
            .setSubject(id) 
            .setExpirationTime(expTime)
            .setIssuedAt()
            .sign(secret); 

        return token;
    } catch (error) {
        console.error('Error al crear el token:', error);
        throw error;
    }
}

tools.verifyToken = async (token) => {
    try {
        const {payload} = await jwVerify(token, secret);
        return payload;
    } catch (error) {
        return false;
    }
}

module.exports = tools;