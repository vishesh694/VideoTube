import  { Router } from "express";
import  { registerUser, loginUser, logoutUser, refreshAccessToken, updateUserAvatar, updateUserCoverImage, changeCurrentPassword, getCurrentUser, updateAccountDetails, getUserChannelProfile, getWatchHistory } from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {upload} from "../middlewares/multer.middleware.js";   // multer is a middleware in uploading files to cloudinary

const router = Router();

router.route("/register").post(
    upload.fields([
        {
            name: "coverImage",                 // taken two objects, one for coverImage and one for avatar
            maxCount: 1
        },
        {
            name: "avatar",     
            maxCount: 1
        }
    ]),
    registerUser
)

router.route("/login").post(loginUser)

router.route("/logout").post(verifyJwt, logoutUser)  

router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJwt,changeCurrentPassword)

router.route("/current-user").get(verifyJwt, getCurrentUser)

router.route("/update-account").patch(verifyJwt, updateAccountDetails)

router.route("/update-avatar").patch(verifyJwt, upload.single("avatar"), updateUserAvatar)

router.route("/update-coverimage").patch(verifyJwt, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJwt, getUserChannelProfile)

router.route("/history").get(verifyJwt, getWatchHistory)

export default router;  