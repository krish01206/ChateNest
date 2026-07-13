const express = require("express");

const router = express.Router();

const protect = require("../middleware/authMiddleware");
const upload = require("../middleware/uploadMiddleware");

const {

createConversation,

getConversations,

sendMessage,

getMessages,

deleteMessage,

updateMessage

} = require("../controllers/messageController");

router.post("/conversation", protect, createConversation);

router.get("/conversation", protect, getConversations);

router.post("/", protect, upload.single("file"), sendMessage);

router.get("/:id", protect, getMessages);

router.delete("/:id", protect, deleteMessage);

router.put("/:id", protect, updateMessage);

module.exports = router;