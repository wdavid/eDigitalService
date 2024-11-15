const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const cors = require('cors'); // Importa CORS
const database = require('./config/database.config');

const apiRouter = require('./routes/index.router');

const app = express();
database.connect();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// Configura CORS
const corsOptions = {
    origin: '*', // Cambia "*" por el dominio de tu frontend, como "http://localhost:3000"
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
};
app.use(cors(corsOptions));

app.use('/api', apiRouter);

module.exports = app;

