const express=require("express");

const router=express.Router();

const protect=require("../middleware/authMiddleware");
const upload=require("../middleware/uploadMiddleware");

const{

getAllUsers,

getUser,

searchUsers,

updateProfile,

changePassword,

uploadProfilePic

}=require("../controllers/userController");

router.get("/",protect,getAllUsers);

router.get("/search",protect,searchUsers);

router.get("/:id",protect,getUser);

router.put("/update",protect,updateProfile);

router.put("/password",protect,changePassword);

router.put(
"/profile-picture",
protect,
upload.single("profilePic"),
uploadProfilePic
);

module.exports=router;