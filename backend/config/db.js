const mongoose = require("mongoose");

const connectDB = async () => {
    try {

        await mongoose.connect(process.env.MONGO_URI);

        console.log("MongoDB Connected Successfully");

    } catch (error) {

        console.error("Database connection failed. Express will continue running but DB calls might fail.");
    }
};

module.exports = connectDB;