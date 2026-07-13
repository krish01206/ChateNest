const path = require("path");
const express = require("express");
const dotenv = require("dotenv");

dotenv.config({
    path: path.resolve(__dirname, ".env")
});

console.log("Cloud:", process.env.CLOUDINARY_CLOUD_NAME);

const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");
const userRoutes=require("./routes/userRoutes");
const messageRoutes = require("./routes/messageRoutes");


dotenv.config();

const connectDB = require("./config/db");

const errorMiddleware = require("./middleware/errorMiddleware");

const authRoutes = require("./routes/authRoutes");

const app = express();

connectDB();

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://chate-nest.vercel.app/",
    ],
    credentials: true,
  })
);

app.use(helmet());

app.use(morgan("dev"));

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});

app.use(limiter);

app.get("/", (req, res) => {

    res.json({
        success: true,
        message: "ChatNest API Running"
    });

});

app.use("/api/auth", authRoutes);

app.use("/api/users",userRoutes);

app.use("/api/messages", messageRoutes);

app.use(errorMiddleware);

module.exports = app;