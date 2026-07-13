const bcrypt = require("bcryptjs");
const User = require("../models/User");
const cloudinary = require("../config/cloudinary");

// GET ALL USERS

exports.getAllUsers = async (req, res) => {
    try {

        const users = await User.find({_id:{$ne:req.user._id}})
        .select("-password");

        res.status(200).json({
            success:true,
            users
        });

    } catch (error) {

        res.status(500).json({
            success:false,
            message:error.message
        });

    }
};


// GET SINGLE USER

exports.getUser = async(req,res)=>{

    try{

        const user = await User.findById(req.params.id)
        .select("-password");

        if(!user){

            return res.status(404).json({
                success:false,
                message:"User not found"
            });

        }

        res.status(200).json({
            success:true,
            user
        });

    }

    catch(error){

        res.status(500).json({
            success:false,
            message:error.message
        });

    }

};


// SEARCH USER

exports.searchUsers = async(req,res)=>{

    try{

        const keyword=req.query.keyword;

        const users=await User.find({

            $or:[

                {name:{$regex:keyword,$options:"i"}},

                {email:{$regex:keyword,$options:"i"}}

            ],

            _id:{$ne:req.user._id}

        }).select("-password");

        res.status(200).json({

            success:true,
            users

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};


// UPDATE PROFILE

exports.updateProfile=async(req,res)=>{

    try{

        const{name,email}=req.body;

        const user=await User.findById(req.user._id);

        if(!user){

            return res.status(404).json({

                success:false,

                message:"User not found"

            });

        }

        user.name=name||user.name;

        user.email=email||user.email;

        await user.save();

        res.status(200).json({

            success:true,

            message:"Profile Updated",

            user

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};


// CHANGE PASSWORD

exports.changePassword=async(req,res)=>{

    try{

        const{

            currentPassword,

            newPassword

        }=req.body;

        const user=await User.findById(req.user._id);

        const isMatch=await bcrypt.compare(

            currentPassword,

            user.password

        );

        if(!isMatch){

            return res.status(400).json({

                success:false,

                message:"Current Password Incorrect"

            });

        }

        user.password=await bcrypt.hash(

            newPassword,

            10

        );

        await user.save();

        res.status(200).json({

            success:true,

            message:"Password Updated"

        });

    }

    catch(error){

        res.status(500).json({

            success:false,

            message:error.message

        });

    }

};

exports.uploadProfilePic = async (req, res) => {

    try {

        if (!req.file) {

            return res.status(400).json({
                success: false,
                message: "No Image Uploaded"
            });

        }

        const result = await new Promise((resolve, reject) => {

            cloudinary.uploader.upload_stream(

                {
                    folder: "ChatNest/Profile"
                },

                (error, result) => {

                    if (error) reject(error);

                    else resolve(result);

                }

            ).end(req.file.buffer);

        });

        const user = await User.findById(req.user._id);

        user.profilePic = result.secure_url;

        await user.save();

        res.status(200).json({

            success: true,

            message: "Profile Picture Uploaded",

            profilePic: result.secure_url

        });

    }

    catch (error) {

        res.status(500).json({

            success: false,

            message: error.message

        });

    }

};