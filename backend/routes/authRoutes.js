const express = require("express");

const router = express.Router();

const {

    register,
    login,
    logout,
    getMe

} = require("../controllers/authController");

const protect = require("../middleware/authMiddleware");

const validate = require("../middleware/validate");

const {

    registerValidator,
    loginValidator

} = require("../validators/authValidator");

router.post(
    "/register",
    registerValidator,
    validate,
    register
);

router.post(
    "/login",
    loginValidator,
    validate,
    login
);

router.post(
    "/logout",
    protect,
    logout
);

router.get(
    "/me",
    protect,
    getMe
);

module.exports = router;