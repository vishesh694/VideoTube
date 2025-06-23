import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {Video} from "../models/video.model.js"
import {Comment} from "../models/comment.model.js"
import {Tweet} from "../models/tweet.model.js"
import {ApiError} from "../utils/apiError.js"
import {ApiResponse} from "../utils/apiResponse.js"
import {asynchandler} from "../utils/asynchandler.js"

const toggleVideoLike = asynchandler(async (req, res) => {
    const {videoId} = req.params
    const video = await Video.findById(videoId);
    if (!video){
        throw new ApiError(404,"Video not found");
    }

    const existingStatus = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    });

    if (!existingStatus) {
        const newLike = await Like.create(
            {
                video:videoId,
                likedBy:req.user._id
            }
        )

        return res
        .status(200)
        .json(
            new ApiResponse(200,newLike,"Video liked Successfully")
        )
    }
    else {
        await Like.deleteOne({_id: existingStatus._id})
        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Successfully unliked")
        )
    }

})

const toggleCommentLike = asynchandler(async (req, res) => {
    const {commentId} = req.params
    const comment = await Comment.findById(commentId);
    if (!comment){
        throw new ApiError(404,"comment not found");
    }

     const existingStatus = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    });

    if (!existingStatus) {
        const newLike = await Like.create(
            {
                comment:commentId,
                likedBy:req.user._id
            }
        )

        return res
        .status(200)
        .json(
            new ApiResponse(200,newLike,"comment liked Successfully")
        )
    }
    else {
        await Like.deleteOne({_id: existingStatus._id})
        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Successfully unliked")
        )
    }


})

const toggleTweetLike = asynchandler(async (req, res) => {
    const {tweetId} = req.params
    const tweet = await Tweet.findById(tweetId);
    if (!tweet){
        throw new ApiError(404,"tweet not found");
    }

     const existingStatus = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    });

    if (!existingStatus) {
        const newLike = await Like.create(
            {
                tweet:tweetId,
                likedBy:req.user._id
            }
        )

        return res
        .status(200)
        .json(
            new ApiResponse(200,newLike,"tweet liked Successfully")
        )
    }
    else {
        await Like.deleteOne({_id: existingStatus._id})
        return res
        .status(200)
        .json(
            new ApiResponse(200,{},"Successfully unliked")
        )
    }

}
)

const getLikedVideos = asynchandler(async (req, res) => {
    const userId = req.user._id;

    const likedVideos = await Like.find({likedBy:userId})
    .populate({
       path: 'video',
            select: ' title thumbnail'
        });

    // Extract only the populated video objects
    const videos = likedVideos.map((like) => like.video);

    return res.status(200).json(
        new ApiResponse(200, videos, "Liked videos fetched successfully")
    );
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}