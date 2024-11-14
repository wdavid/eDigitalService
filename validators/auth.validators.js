const {body} = require('express-validator');

const validators = {};

validators.registerValidator = [
    body('username')
        .notEmpty().withMessage('Username is required')
        .isLength({min: 4, max: 32}).withMessage('Username must be at least 4 characters long'),
    body('email')
        .notEmpty().withMessage('Email is required')
        .isEmail().withMessage('Invalid email address'),
    body('fechaNacimiento')
        .notEmpty().withMessage('Fecha de nacimiento is required')
        .isDate().withMessage('Invalid date format'),
    body('metaconsumo')
        .notEmpty().withMessage('Metaconsumo is required')
        .isNumeric().withMessage('Invalid number format'),
    body('password')
        .notEmpty().withMessage('Password is required')
        .isLength({min: 6}).withMessage('Password must be at least 6 characters long'),
];
module.exports = validators;