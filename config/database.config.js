const Mongoose = require('mongoose');
const debug = require('debug')('app:database');

const host = process.env.DBHOST || 'localhost';
const port = process.env.DBPORT || '27017';
const database = process.env.DBNAME || 'edigital';

const dbURI = process.env.DBURI || `mongodb://${host}:${port}/${database}`;

const connect = async () => {
    try {
        await Mongoose.connect(dbURI);
        debug('Database connection successful');
   }
    catch (error) {
        console(error);
        debug('Database connection failed');
        process.exit(1);
    }
};

const disconnect = async () => {
    try {
        await Mongoose.disconnect();
        debug('Database connection closed');
    }
    catch (error) {
        console(error);
        debug('Database connection close failed');
        process.exit(1);
    }
};

module.exports = { connect, disconnect };