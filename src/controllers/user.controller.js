import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js"; 
import { User } from "../models/user.model.js";
import { uploadCloudinary, deleteCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/apiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessandRefreshTokens = async (userId) =>
{
  try {
    const user = await User.findById(userId);
    const refreshToken = await user.generateRefreshToken();
    const accessToken = await user.generateAccessToken();

    user.refreshToken = refreshToken; // save refresh token to user document
    await user.save({ validateBeforeSave: false }); // skip validation for refreshToken field

    return { accessToken, refreshToken };

  } catch (error) {
    throw new ApiError (500, "Something went wrong")
  }
}

const registerUser = asynchandler(async (req, res) => {
  //extract the user data from the req body i.e get use data from frontend
  // validation - not empty
  // check if user already exists : email,username
  // check for images,avatar, if available upload to cloudinary
  // create user in db
  // send response to frontend
  // remove password and refresh token from response
  // check for user creation
  // return response with user data
  const {username, email, fullName, password} = req.body;
  if ([username, fullName , email , password ].some((fields) => 
    fields?.trim() === ""
  )){
    throw new ApiError(400, "All fields are required");
  }
  // if (fullName === "" ) {                              // another way to check for empty string
  //   throw new ApiError(400, "Full name is required");
  // }

  const existedUser= await User.findOne({
    $or: [{ username }, { email }]
  })
  if (existedUser){
    throw new ApiError(409, "User already exists with this username or email");
  }
  // console.log(req.files);
  // check for images
  const avatarLocalPath = req.files?.avatar[0]?.path; // optional chaining to avoid error if avatar is not present
  // const coverImageLocalPath = req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
    coverImageLocalPath = req.files.coverImage[0].path; // optional chaining to avoid error if coverImage is not present
  }

  if ( !avatarLocalPath ){
    throw new ApiError(400, "Avatar is required");
  }
  // upload images to cloudinary
  const avatar = await uploadCloudinary(avatarLocalPath);
  const coverImage = await uploadCloudinary(coverImageLocalPath);

  if (!avatar) {
    throw new ApiError(500, "Avatar upload failed");
  }

  // create user in db
  const user = await User.create({
    fullName,
    username: username.toLowerCase(),
    email: email.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    password, // password will be hashed in user model pre-save hook
  })

  // remove password and refresh token from response
  const registeredUser = await User.findById(user._id).select(
    "-password -refreshToken"
  )
  if (!registeredUser) {          // check if user is created
    throw new ApiError(500, "User registration failed");
  }
  // return response with user data
  res.status(201).json(
    new ApiResponse(201, registeredUser, "User registered successfully")
  );
});

const loginUser = asynchandler (async(req,res) => {
  // user data from req body
  // email or username and password
  // check if user exists
  // check password
  // generate access token and refresh token
  // send cookies with tokens

  const { username,email, password } = req.body;
  if (!email && !username) {
    throw new ApiError(400, "Email or username is required");
  }
  if (!password) {
    throw new ApiError(400, "Password is required");
  }

  const user = await User.findOne({
    $or: [{username} , {email}]
  })
  
  if (!user){
    throw new ApiError(404, "User not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password)
  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid password");
  }
  
  // Genarate access token and refresh token
  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(user._id);

  const loggedInUser = await User.findById(user._id).select( "-password -refreshToken ");

  // send cookies with tokens
  const options = {
    httpOnly: true,
    secure: true
  }
  res.clearCookie("acccessToken", options)            //extra cookie due to typo in previous code
  return res
  .status(200)
  .cookie("accessToken", accessToken, options)
  .cookie("refreshToken", refreshToken, options)
  .json(
    new ApiResponse(
      200,
      {
        user: loggedInUser, accessToken, refreshToken
      },
      "User has successfully logged in"
    )
  )
});

const logoutUser = asynchandler( async(req,res) => {
  // clear cookies
  // remove refresh token from user document
  // send response
  User.findByIdAndUpdate(
    await req.user._id,
    {
      $set: {
        refreshToken: undefined
      },
      
    },
    {
      new: true, // return the updated user
    },
  )
  const options = {
    httpOnly: true,
    secure: true
  }
  return res
    .status(200)
    .clearCookie("accessToken", options) // clear access token cookie
    .clearCookie("refreshToken", options) // clear refresh token cookie
    .json(
      new ApiResponse(
        200,
        {},
        "User has successfully logged out"
      )
    )
  
})

const refreshAccessToken = asynchandler(async (req, res) => {
  // get refresh token from cookies
  // verify refresh token
  // generate new access token
  // send new access token in response

  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Refresh token is required");
  }
  try {
    const decodedToken = await jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET )
  
    const user = await User.findById(decodedToken?._id)
  
    if (!user) {
      throw new ApiError(401, "Invalid refresh token");
    }
  
    if (incomingRefreshToken !== user.refreshToken) {
      throw new ApiError(401, "Invalid refresh token");
    }
  
    const options = {
      httpOnly: true,
      secure: true
    }
  
    const { accessToken, newRefreshToken } = await generateAccessandRefreshTokens(user._id)
  
    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", newRefreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken: newRefreshToken },
          "Access token refreshed successfully"
        )
      )
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }

})

const changeCurrentPassword = asynchandler( async(req,res) => {
  // get user from req.user
  // get current password from req.body
  // check if current password is correct
  // if correct, update password
  // send response

  const {oldPassword, newPassword} = req.body;

  if (!oldPassword || !newPassword) {
    throw new ApiError(400, "Old password and new password are required");
  }

  const user = await User.findById(req.user?._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);
  if (!isPasswordCorrect) {
    throw new ApiError(401, "Old Password is incorrect")
  }

  user.password = newPassword; // this will trigger pre-save hook to hash the password
  await user.save( {validateBeforeSave: false}); // skip validation for password field

  return res
  .status(200)
  .json(
    new ApiResponse(200, {}, "Password changed successfully")
  )

})

const getCurrentUser = asynchandler( async(req, res) => {
  return res
  .status(200)
  .json(
    new ApiResponse(200,req.user, "Current user fetched successfully")
  )
})

//Keep separate controller for files

const updateAccountDetails = asynchandler( async(req,res) => {
  // get user from req.user
  // get updated details from req.body
  // check if user exists
  // update user details
  // send response

  const {fullName, email} = req.body;
  if (!fullName || !email) {
    throw new ApiError(400, "Full name and email are required");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        fullName,
        email: email
      }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "User details updated successfully")
  )

})

const updateUserAvatar = asynchandler( async(req,res) => {
  // get user from req.user
  // get avatar from req.files
  // check if user exists
  // upload avatar to cloudinary
  // update user avatar
  // send response

  const avatarLocalPath = req.file?.path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "Avatar is required");
  }

  const avatar = await uploadCloudinary(avatarLocalPath);
  
  if (!avatar.url ) {
    throw new ApiError(400, "Error while uploading the avatar")
  }
  
  // const existingUser = await User.findById(req.user._id);
  //  if (!existingUser) {
  //   throw new ApiError(404, "User not found");
  // }
  // await deleteCloudinary(existingUser.avatar?.public_id); // delete old avatar from cloudinary if exists

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
         avatar: avatar.url//{
        //   url: avatar.url,
        //   public_id: avatar.public_id // if you want to store public_id for future reference
        // }
      }
    },
    {new: true} // return the updated user
  ).select("-password")


  return res
  .status(200)  
  .json(
    new ApiResponse(200, user, "User avatar updated successfully") 
  )

})

const updateUserCoverImage = asynchandler( async(req,res) => {

  const coverImageLocalPath = req.file?.path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "Cover image is required");
  }

  const coverImage = await uploadCloudinary(coverImageLocalPath);
  if (!coverImage.url){
    throw new ApiError(400, "Error while uploading the cover image")
  }

  // const existingUser = await User.findById(req.user._id);
  //  if (!existingUser) {
  //   throw new ApiError(404, "User not found");
  // }
  // await deleteCloudinary(existingUser.coverImage?.public_id); 
  
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set:{
        coverImage: coverImage.url //{
        //   url: coverImage.url,
        //   public_id: coverImage.public_id // if you want to store public_id for future reference
        // }
      }
    },
    {new: true} // return the updated user
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse(200, user, "User cover image updated successfully") 
  )

})

const getUserChannelProfile = asynchandler( async(req,res) => {
  const {username} = req.params
  if (!username?.trim()) {
    throw new ApiError(400, "Username is required");
  }

  const channel = await User.aggregate([
    {
      $match: {
        username: username?.toLowerCase()
      }
    },
    {
      $lookup: {
        from: "subscriptions", // collection name in MongoDB,everything is lowercase and plural;
        localField: "_id", // field in the current collection
        foreignField: "channel", // field in the foreign collection;
        as: "subscribers" // name of the new array field to add to the output documents;
      }
    },
    {
      $lookup:{
        from: "subscriptions",
        localField: "_id",
        foreignField: "subscriber",
        as: "subscriptions"
      }
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers"
        },
        subscriptionsCount: {
          $size: "$subscriptions"
        },
        isSubscribed: {
          $cond: {
            if: {
              $in: [req.user?._id, "$subscriptions.subscriber"]
            },
            then: true,
            else: false
          }
        }
      }
    },
    {
      $project: {
        fullName: 1,
        username: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
        subscribersCount: 1,
        subscriptionsCount: 1,
        isSubscribed: 1,
        createdAt: 1
      }
    }
    
  ])
  if (!channel?.length) {
    throw new ApiError(404, "Channel not found");
  }
  return res
  .status(200)
  .json(
    new ApiResponse (200,channel[0],"Channel fetched successfully")
  )

})

const getWatchHistory = asynchandler( async(req,res) => {
  const user = await User.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(req.user._id)
      }
    },
    {
      $lookup: {
        from: "videos",
        localField: "watchHistory",
        foreignField: "_id",
        as: "watchHistory",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
              {
                $project: {
                  fullName: 1,
                  username: 1,
                  email: 1
                }
              }
            ]
            }
          },
          {
            $addFields:{
              owner: {
                $first:"$owner"
              }
            }
          }
        ]
      }

    }
  ])

  return res
  .status(200)
  .json(
    new ApiResponse(200, user[0].watchHistory, "Successfully fetched the watch history")
  )
})

export { registerUser, loginUser, logoutUser, refreshAccessToken, 
  changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, 
  updateUserCoverImage, getUserChannelProfile,getWatchHistory
};
