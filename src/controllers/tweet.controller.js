import { ApiError } from "../utils/apiError.js"; 
import { User } from "../models/user.model.js";
import { Tweet } from "../models/tweet.model.js";
import { ApiResponse } from "../utils/apiResponse.js";
import { asynchandler } from '../utils/asynchandler.js';

const createTweet = asynchandler( async(req,res) => {
    const { content } = req.body;
    if (!content) {
        throw new ApiError(404,"Content not found");
    }

    const tweet = await Tweet.create({
        content: content,
        owner: req.user._id
    })

    await tweet.populate({
        path:'owner',
        select: 'username avatar'
    })

    return res
    .status(201)
    .json(
        new ApiResponse(201,tweet,"Tweet Successfully created")
    )

})

const getUserTweets = asynchandler( async(req,res) => {
    const { userId } = req.params;
    const {page = 1, limit = 10} = req.query
    const user = await User.findById(userId);
    if (!user) {
        throw new ApiError(404,"User not found");
    }

    const tweets = await Tweet.find({owner:userId})
    .populate({
        path:'owner',
        select:'username avatar'
    })
    .sort({createdAt:-1})
    .skip((page-1)*limit)
    .limit(parseInt(limit))
    .exec()

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweets,"Got all tweets successfully")
    )

})

const updateTweet = asynchandler(async (req, res) => {
    // TODO: update a comment
    const { tweetId } = req.params;
    const { updatedContent } = req.body;
    if (!updatedContent){
        throw new ApiError(404,"Content not found");
    }

    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404,"tweet not found");
    }

    // authorization check
    if (tweet.owner.toString() !== req.user._id.toString() ){
        throw new ApiError(403,"You are not authorized to update the tweet");
    }

    tweet.content = updatedContent;
    await tweet.save();

    return res
    .status(200)
    .json(
        new ApiResponse(200,tweet,"Tweet updated successfully")
    )

})

const deleteTweet = asynchandler(async (req, res) => {
    // TODO: delete a comment
    const { tweetId } = req.params;
    
    const tweet = await Tweet.findById(tweetId);
    if (!tweet) {
        throw new ApiError(404,"Tweet not found");
    }

    // authorization check
    if (tweet.owner.toString() !== req.user._id.toString() ){
        throw new ApiError(403,"You are not authorized to delete the tweet");
    }

    await tweet.deleteOne();

    return res
    .status(200)
    .json(
        new ApiResponse(200,{},"Tweet deleted successfully")
    )

})

export {
    createTweet,
    getUserTweets,
    deleteTweet,
    updateTweet
}