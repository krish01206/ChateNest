const { body } = require("express-validator");

exports.registerValidator = [

    body("name")
        .trim()
        .notEmpty()
        .withMessage("Name is required"),

    body("email")
        .isEmail()
        .withMessage("Valid email required"),

    body("password")
        .isLength({ min: 6 })
        .withMessage("Password must be minimum 6 characters")

];

exports.loginValidator = [

    body("email")
        .isEmail()
        .withMessage("Valid email required"),

    body("password")
        .notEmpty()
        .withMessage("Password required")

];