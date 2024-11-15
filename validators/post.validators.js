const { body } = require('express-validator');
const validators = {}

validators.createPostValidators = [
    body("userId")
        .notEmpty()
        .isMongoId()
        .withMessage("Invalid userId"),
    body("fecha")
        .notEmpty()
        .isDate()
        .withMessage("Invalid fecha"),
    body("volumen")
        .notEmpty()
        .isNumeric()
        .withMessage("Invalid volumen"),
    body("vasos")
        .notEmpty()
        .isNumeric()
        .withMessage("Invalid vasos"),
];
module.exports = validators;