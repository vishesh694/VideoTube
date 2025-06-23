import { asynchandler } from "../utils/asynchandler.js";
import { ApiError } from "../utils/apiError.js"; 
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";
import { ApiResponse } from "../utils/apiResponse.js";

const getVideoComments = asynchandler(async (req, res) => {
    //TODO: get all comments for a video
    const { videoId } = req.params
    const {page = 1, limit = 10} = req.query

    const video = await Video.findById(videoId);
    if (!video) {
        throw new ApiError(404,"Video not found");
    }

    const comments = await Comment.find({video: videoId})
    .populate({
        path: 'owner',    // comment has a user field
        select: 'username avatar'
    })
    .sort({ createdAt:-1 })
    .skip((page-1)*limit)
    .limit(parseInt(limit))
    .exec()

    return res
    .status(200)
    .json(
        new ApiResponse(200,comments,"Got all comments successfully")
    )

})

const addComment = asynchandler(async (req, res) => {
    // TODO: add a comment to a video
    const { videoId } = req.params;
    const video = await Video.findById(videoId);
    if (!video){
        throw new ApiError(404,"Video not found");
    }

    const { content } = req.body;
    if (!content){
        throw new ApiError(404,"Content not found");
    }

    const comment = await Comment.create({
        content,
        video: videoId,
        owner: req.user._id
    })
    const populatedComment = await comment.populate({
        path: "owner",
        select: "username avatar",
    });

    await comment.save();

    return res
    .status(201)
    .json(
        new ApiResponse(201,populatedComment,"Comment added successfully")
    )
})

const updateComment = asynchandler(async (req, res) => {
    // TODO: update a comment
    const { commentId } = req.params;
    const { updatedContent } = req.body;
    if (!updatedContent){
        throw new ApiError(404,"Content not found");
    }

    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404,"Comment not found");
    }

    // authorization check
    if (comment.owner.toString() !== req.user._id.toString() ){
        throw new ApiError(403,"You are not authorized to update the comment");
    }

    comment.content = updatedContent;
    await comment.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,comment,"Comment updated successfully")
    )

})

const deleteComment = asynchandler(async (req, res) => {
    // TODO: delete a comment
    const { commentId } = req.params;
    
    const comment = await Comment.findById(commentId);
    if (!comment) {
        throw new ApiError(404,"Comment not found");
    }

    // authorization check
    if (comment.owner.toString() !== req.user._id.toString() ){
        throw new ApiError(403,"You are not authorized to delete the comment");
    }

    await comment.deleteOne();

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Comment deleted successfully")
    )

})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}