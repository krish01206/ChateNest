const Conversation = require("../models/Conversation");
const Message = require("../models/Message");
const cloudinary = require("../config/cloudinary");

// Create Conversation
exports.createConversation = async (req, res) => {
    try {
        const { receiverId } = req.body;

        let conversation = await Conversation.findOne({
            members: {
                $all: [req.user._id, receiverId]
            }
        }).populate("members", "-password");

        if (conversation) {
            return res.status(200).json({
                success: true,
                conversation
            });
        }

        conversation = await Conversation.create({
            members: [req.user._id, receiverId]
        });

        conversation = await Conversation.findById(conversation._id).populate("members", "-password");

        res.status(201).json({
            success: true,
            conversation
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Get User Conversations (with unread count per conversation)
exports.getConversations = async (req, res) => {
    try {
        const conversations = await Conversation.find({
            members: { $in: [req.user._id] }
        })
        .populate("members", "-password")
        .sort({ lastMessageAt: -1 });

        // Attach unread counts: messages in each conv addressed to current user that are unseen
        const conversationsWithUnread = await Promise.all(
            conversations.map(async (conv) => {
                const unreadCount = await Message.countDocuments({
                    conversationId: conv._id,
                    receiver: req.user._id,
                    seen: false
                });
                return { ...conv.toObject(), unreadCount };
            })
        );

        res.status(200).json({
            success: true,
            conversations: conversationsWithUnread
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Send Message

exports.sendMessage = async (req, res) => {
console.log(req.body);
    try {

        const {

            conversationId,

            receiver,

            text

        } = req.body;

        let imageUrl = req.body.image || "";

        if (req.file) {
            const result = await new Promise((resolve, reject) => {
                cloudinary.uploader.upload_stream(
                    {
                        folder: "ChatNest/Messages",
                        resource_type: "auto"
                    },
                    (error, result) => {
                        if (error) reject(error);
                        else resolve(result);
                    }
                ).end(req.file.buffer);
            });
            imageUrl = result.secure_url;
        }

        const message = await Message.create({

            conversationId,

            sender: req.user._id,

            receiver,

            text,

            image: imageUrl

        });

        await Conversation.findByIdAndUpdate(

            conversationId,

            {

                lastMessage: text || (req.file ? "Sent an attachment" : ""),

                lastMessageAt: new Date()

            }

        );

        res.status(201).json({

            success: true,

            message

        });

    }

    catch (error) {
        console.log(error);

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};


// Get Messages (and auto-mark them as seen for the current user)
exports.getMessages = async (req, res) => {
    try {
        const messages = await Message.find({
            conversationId: req.params.id
        })
            .populate("sender", "name profilePic")
            .populate("receiver", "name profilePic")
            .sort({ createdAt: 1 });

        // Mark all messages addressed to current user as seen
        await Message.updateMany(
            {
                conversationId: req.params.id,
                receiver: req.user._id,
                seen: false
            },
            { $set: { seen: true } }
        );

        res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};


// Delete Message

exports.deleteMessage = async (req, res) => {

    try {

        const message = await Message.findById(req.params.id);

        if (!message) {

            return res.status(404).json({

                success: false,

                message: "Message not found"

            });

        }

        if (message.sender.toString() !== req.user._id.toString()) {

            return res.status(403).json({

                success: false,

                message: "Unauthorized"

            });

        }

        await message.deleteOne();

        res.status(200).json({

            success: true,

            message: "Message Deleted"

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};

// Update Message
exports.updateMessage = async (req, res) => {
    try {
        const message = await Message.findById(req.params.id);

        if (!message) {
            return res.status(404).json({
                success: false,
                message: "Message not found"
            });
        }

        if (message.sender.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: "Unauthorized"
            });
        }

        message.text = req.body.text;
        message.isEdited = true;
        await message.save();

        // Update conversation lastMessage if it's the latest message
        const conversation = await Conversation.findById(message.conversationId);
        const latestMsg = await Message.findOne({ conversationId: message.conversationId })
            .sort({ createdAt: -1 });
        if (latestMsg && latestMsg._id.toString() === message._id.toString() && conversation) {
            conversation.lastMessage = message.text || "Sent an attachment";
            await conversation.save();
        }

        res.status(200).json({
            success: true,
            message
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

// Mark all messages in a conversation as seen (for badge reset)
exports.markSeen = async (req, res) => {
    try {
        await Message.updateMany(
            {
                conversationId: req.params.conversationId,
                receiver: req.user._id,
                seen: false
            },
            { $set: { seen: true } }
        );

        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};